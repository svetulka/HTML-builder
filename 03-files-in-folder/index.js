const path = require('path');
const fs = require('fs').promises;

const patToSecretFolder = path.join(__dirname, 'secret-folder');

readDirs(patToSecretFolder);

async function readDirs(pathToDir) {
    let option = { withFileTypes: true };
    let fsElements = await fs.readdir(pathToDir, option);
    for (let element of fsElements) {
        let curElemPath = path.join(pathToDir, element.name);
        if (element.isDirectory()) {
            readDirs(curElemPath);
        } else {
            getInfoAboutFile(curElemPath)
                .then(info => console.log(info));
        }
    }
}

async function getInfoAboutFile(filePath) {
    let fileStat = await fs.stat(filePath);
    let fileSize = `${fileStat.size}b`;
    let fileExt = path.extname(filePath);
    let fileName = path.basename(filePath, fileExt);
    fileExt = fileExt.replace('.', '');
    let fileInfo = [fileName, fileExt, fileSize].join(' - ');
    return fileInfo;
}