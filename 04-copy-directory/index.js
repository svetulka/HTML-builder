const path = require('path');
const fs = require('fs').promises;

let srcPath = path.join(__dirname, 'files');
let destPath = path.join(__dirname, 'files-copy');

createNewDir(destPath);
copyDirAndFiles(srcPath, destPath);

async function createNewDir(destPath) {
    let isDirNotExist;
    await fs.access(destPath)
        .then(() => isDirNotExist = false)
        .catch(() => isDirNotExist = true);
    if (isDirNotExist) {
        await fs.mkdir(destPath);
    }
}

async function copyDirAndFiles(srcPath, destPath) {
    await removeExtra(srcPath, destPath);
    await dublicateMis(srcPath, destPath);
}

async function removeExtra(srcPath, destPath) {
    let option = { withFileTypes: true };
    let srcElements = await fs.readdir(srcPath, option);
    let destElements = await fs.readdir(destPath, option);
    for (let element of destElements) {
        if (!isElementContain(srcElements, element)) {
            let path4remove = path.join(destPath, element.name);
            element.isDirectory() ? deleteDir(path4remove) : fs.unlink(path4remove);
        } else {
            let nextSrcPath = path.join(srcPath, element.name);
            let nextDestPath = path.join(destPath, element.name);
            if (element.isDirectory()) {
                removeExtra(nextSrcPath, nextDestPath);
            } else {
                let srcFileContent = await fs.readFile(nextSrcPath);
                let destFileContent = await fs.readFile(nextDestPath);
                if (!srcFileContent.equals(destFileContent)) {
                    fs.copyFile(nextSrcPath, nextDestPath);
                }
            }
        }
    }
}
async function dublicateMis(srcPath, destPath) {
    let option = { withFileTypes: true };
    let srcElements = await fs.readdir(srcPath, option);
    let destElements = await fs.readdir(destPath, option);
    for (let element of srcElements) {
        let srcForCopy = path.join(srcPath, element.name);
        let destForCopy = path.join(destPath, element.name);
        if (!isElementContain(destElements, element)) {
            if (element.isDirectory()) {
                fs.mkdir(destForCopy);
                dublicateMis(srcForCopy, destForCopy);
            } else {
                fs.copyFile(srcForCopy, destForCopy);
            }
        } else {
            if (element.isDirectory()) {
                dublicateMis(srcForCopy, destForCopy);
            }
        }
    }
}

function isElementContain(array, element) {
    for (let i = 0; i < array.length; i++) {
        if (array[i].name === element.name) {
            return true;
        }
    }
    return false;
}

async function deleteDir(pathDir) {
    let option = { withFileTypes: true };
    let dir = await fs.readdir(pathDir, option);
    if (dir.length !== 0) {
        for (let element of dir) {
            let currentPath = path.join(pathDir, element.name);
            element.isDirectory() ? await deleteDir(currentPath) : await fs.unlink(currentPath);
        }
    }
    fs.rmdir(pathDir);
}
