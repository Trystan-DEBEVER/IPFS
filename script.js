let ipfs;
const fileTypeMap = {}; // Map pour stocker le CID et son type MIME associé

async function initIPFS() {
    // Initialiser IPFS
    ipfs = await Ipfs.create();
    console.log("IPFS initialisé");
}

// Appel de la fonction d'initialisation IPFS
initIPFS().catch(console.error);

// Fonction pour importer des données
async function importData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png';

    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const addedFile = await ipfs.add(file);
            const cid = addedFile.path; // Récupère le CID

            // Stocker le type MIME dans le map
            fileTypeMap[cid] = file.type;

            // Affiche le CID sur la page
            document.getElementById('cidDisplay').innerText = `CID importé : ${cid}`;
            document.getElementById('fileContent').innerHTML = ''; // Efface le contenu précédent
        }
    };

    fileInput.click(); // Ouvre le sélecteur de fichiers
}

// Fonction pour exporter des données
async function exportData() {
    const cid = prompt("Veuillez entrer le CID du document à exporter :");
    if (cid) {
        try {
            const stream = ipfs.cat(cid);
            const data = [];

            // Collecte les données à partir du flux
            for await (const chunk of stream) {
                data.push(chunk);
            }

            // Convertir les données collectées en Uint8Array
            const fileData = new Uint8Array(data.reduce((acc, curr) => [...acc, ...curr], []));

            // Récupère le type MIME du fichier à partir du map
            const fileType = fileTypeMap[cid];

            if (fileType === 'application/pdf') {
                const blob = new Blob([fileData], { type: fileType });
                const url = URL.createObjectURL(blob);

                // Créer un iframe pour la prévisualisation du PDF
                const iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '600px';
                iframe.src = url;

                // Efface le contenu précédent et affiche l'iframe
                document.getElementById('fileContent').innerHTML = ''; 
                document.getElementById('fileContent').appendChild(iframe);
            } else if (fileType === 'image/png') {
                const blob = new Blob([fileData], { type: fileType });
                const url = URL.createObjectURL(blob);
                const img = document.createElement('img');
                img.src = url;
                img.style.maxWidth = '100%'; 

                // Efface le contenu précédent et affiche l'image
                document.getElementById('fileContent').innerHTML = ''; 
                document.getElementById('fileContent').appendChild(img);
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const blob = new Blob([fileData], { type: fileType });
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = `document.docx`;
                downloadLink.innerText = 'Cliquez ici pour télécharger le fichier Word.';
                
                // Efface le contenu précédent et affiche le lien de téléchargement
                document.getElementById('fileContent').innerHTML = ''; 
                document.getElementById('fileContent').appendChild(downloadLink);
            } else {
                alert("Type de fichier non pris en charge.");
            }
        } catch (error) {
            console.error("Erreur lors de l'exportation : ", error);
            alert("Une erreur s'est produite lors de l'exportation du fichier. Vérifiez le CID et réessayez.");
        }
    } else {
        alert("Aucun CID fourni.");
    }
}
