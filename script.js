let ipfs;
const fileTypeMap = {}; // Map pour stocker le CID et son type MIME associé

// Fonction d'initialisation d'IPFS
async function initIPFS() {
    try {
        // Initialiser IPFS
        ipfs = await Ipfs.create();
        console.log("IPFS initialisé");
    } catch (error) {
        console.error("Erreur lors de l'initialisation d'IPFS : ", error);
        alert("Échec de l'initialisation d'IPFS.");
    }
}

// Appel de la fonction d'initialisation IPFS
initIPFS().catch(console.error);

// Fonction pour importer des fichiers sur IPFS
async function importData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,text/plain';

    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                // Vérifier que IPFS est bien initialisé
                if (!ipfs) {
                    alert("IPFS n'est pas initialisé. Veuillez réessayer.");
                    return;
                }

                // Ajouter le fichier à IPFS
                const addedFile = await ipfs.add(file);
                const cid = addedFile.path; // Récupérer le CID

                // Stocker le type MIME dans le map
                fileTypeMap[cid] = file.type;

                // Afficher le CID sur la page
                document.getElementById('cidDisplay').innerText = `CID importé : ${cid}`;
                document.getElementById('fileContent').innerHTML = ''; // Effacer le contenu précédent
                console.log(`Fichier ajouté avec succès. CID : ${cid}`);
            } catch (error) {
                console.error("Erreur lors de l'importation du fichier : ", error);
                alert("Une erreur est survenue lors de l'importation.");
            }
        }
    };

    fileInput.click(); // Ouvrir le sélecteur de fichiers
}

async function exportData() {
    const cid = prompt("Veuillez entrer le CID du document à exporter :");
    if (cid) {
        try {
            // Tenter de récupérer les données via IPFS local
            const stream = ipfs.cat(cid);
            const data = [];

            for await (const chunk of stream) {
                data.push(chunk);
            }

            // Convertir les données collectées en Uint8Array
            const fileData = new Uint8Array(data.reduce((acc, curr) => [...acc, ...curr], []));
            let fileType = fileTypeMap[cid]; // Vérifier si le type MIME est déjà connu

            if (!fileType) {
                fileType = detectMimeType(fileData);
                console.log(`Type MIME détecté : ${fileType}`);
            }

            const blob = new Blob([fileData], { type: fileType });
            displayFile(blob, fileType);

        } catch (error) {
            console.error("Erreur lors de l'exportation : ", error);
            alert("Une erreur s'est produite lors de l'exportation du fichier. Vérifiez le CID et réessayez.");
        }
    } else {
        alert("Aucun CID fourni.");
    }
}

// Fonction pour afficher le fichier selon son type
function displayFile(blob, fileType) {
    const url = URL.createObjectURL(blob);

    if (fileType === 'application/pdf') {
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.src = url;
        document.getElementById('fileContent').innerHTML = ''; 
        document.getElementById('fileContent').appendChild(iframe);
    } else if (fileType === 'image/png' || fileType === 'image/jpeg') {
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        document.getElementById('fileContent').innerHTML = ''; 
        document.getElementById('fileContent').appendChild(img);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `document.docx`;
        downloadLink.innerText = 'Cliquez ici pour télécharger le fichier Word.';
        document.getElementById('fileContent').innerHTML = ''; 
        document.getElementById('fileContent').appendChild(downloadLink);
    } else if (fileType === 'text/plain') {
        // Lire le fichier texte et l'afficher
        const reader = new FileReader();
        reader.onload = function(e) {
            const pre = document.createElement('pre');
            pre.innerText = e.target.result;
            document.getElementById('fileContent').innerHTML = ''; 
            document.getElementById('fileContent').appendChild(pre);
        };
        reader.readAsText(blob); // Lire le blob en tant que texte
    } else {
        alert("Type de fichier non pris en charge.");
    }
}
