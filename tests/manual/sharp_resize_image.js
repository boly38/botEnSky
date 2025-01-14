import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs/promises';

// Fonction pour redimensionner et compresser l'image
const resizeImage = async (inputBuffer) => {
    let quality = 95; // Qualité initiale
    let outputBuffer;

    // Redimensionnement initial
    outputBuffer = await sharp(inputBuffer)
        // .resize({ width: 1200 }) // Ajustez la largeur selon vos besoins
        .jpeg({quality}) // Format JPEG avec qualité initiale
        .toBuffer();
    console.log(`inputBuffer:${inputBuffer.length}\n => quality ${quality} : length:${outputBuffer.length}`);

    // Vérifiez la taille du buffer
    while (outputBuffer.length > 1000000 && quality > 10) {
        quality -= 5; // Réduisez la qualité par paliers de 5
        outputBuffer = await sharp(inputBuffer)
            // .resize({ width: 800 }) // Redimensionnez à nouveau si nécessaire
            .jpeg({quality})
            .toBuffer();
        console.log(` => quality ${quality} : length:${outputBuffer.length}`);
    }

    return outputBuffer;
};

// Fonction principale pour télécharger l'image et traiter
const main = async () => {
    // const aigleUrl = 'https://images.unsplash.com/photo-1660307412981-3c353d3ad8ef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w2OTU4MjV8MHwxfGNvbGxlY3Rpb258MXxubFdidGJmXy0wQXx8fHx8Mnx8MTczNjc5NjU5OHw&ixlib=rb-4.0.3&q=85';
    const imageUrl = 'https://images.unsplash.com/photo-1616496379174-02bb612338e1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w2OTU4MjV8MHwxfGNvbGxlY3Rpb258MXx0R1hkZEZFUWRLRXx8fHx8Mnx8MTczNjc5NjQzOXw&ixlib=rb-4.0.3&q=85';

    try {
        const response = await axios.get(imageUrl, {responseType: 'arraybuffer'});
        const responseLength = response.data.length;
        const inputBuffer = Buffer.from(response.data); // Convertir la réponse en buffer

        const resizedImageBuffer = await resizeImage(inputBuffer);

        // Écrire le buffer dans un nouveau fichier
        await fs.writeFile('output.jpg', resizedImageBuffer);
        console.log(`Image (${responseLength} redimensionnée et compressée enregistrée sous output.jpg`);
    } catch (err) {
        console.error('Erreur:', err);
    }
};

// Exécuter la fonction principale
main();
