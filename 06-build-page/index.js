const path = require('path');
const fs = require('fs').promises;

const DEST_DIR = 'project-dist';
const COMPONENTS_DIR = 'components';
const INDEX_HTML = 'index.html';
const TEMPLATE_HTML = 'template.html';
const STYLES_CSS = 'styles.css';
const COMPONENT_FILE_EXTENSION = '.html';
const STYLES_DIR = 'styles';
const ASSETS_DIR = 'assets';

let destDirPath = path.join(__dirname, DEST_DIR);
let srcComponentsPath = path.join(__dirname, COMPONENTS_DIR);
let destIndexPath = path.join(destDirPath, INDEX_HTML);
let srcIndexPath = path.join(__dirname, TEMPLATE_HTML);
let destStylePath = path.join(destDirPath, STYLES_CSS);
let srcStylesPath = path.join(__dirname, STYLES_DIR);
let destAssetsPath = path.join(destDirPath, ASSETS_DIR);
let srcAssetsPath = path.join(__dirname, ASSETS_DIR);

(async function createHtmlBundle() {
    await createDestDir();
    await createIndexFile();
    updateIndexFile();
    await createStyleFile();
    updateStyleFile();
    await createAssetsDir();
    updateAssetsDir();
})();

async function isSrcExist(src) {
    let result;
    await fs.access(src)
        .then(() => result = true)
        .catch(() => result = false);
    return result;
}

async function createDestDir() {
    let isDestDirExist = await isSrcExist(destDirPath);
    if (!isDestDirExist) {
        fs.mkdir(destDirPath);
    }
}

async function createIndexFile() {
    let isIndexFileExist = await isSrcExist(destIndexPath);
    if (!isIndexFileExist) {
        fs.writeFile(destIndexPath, '');
    }
}

async function createStyleFile() {
    let isStylesFileExist = await isSrcExist(destStylePath);
    if (!isStylesFileExist) {
        fs.writeFile(destStylePath, '');
    }
}

async function createAssetsDir() {
    let isAssetsDirExist = await isSrcExist(destAssetsPath);
    if (!isAssetsDirExist) {
        fs.mkdir(destAssetsPath);
    }
}

async function updateIndexFile() {
    let templates = {};
    let templateBody = await fs.readFile(srcIndexPath, { encoding: 'utf-8' });
    let templateTag = getTemplateTag(templateBody);
    while (templateTag) {
        let tag = templateTag.replace('{{', '').replace('}}', '').trim();
        if (templates[tag]) {
            templateBody.replace(templateTag, templates[tag]);
        } else {
            let componentPath = path.join(srcComponentsPath, tag + COMPONENT_FILE_EXTENSION);
            let componentBody = await fs.readFile(componentPath, { encoding: 'utf-8' });
            templateBody = templateBody.replace(templateTag, componentBody);
            templates[tag] = componentBody;
        }
        templateTag = getTemplateTag(templateBody);
    }
    let currentContent = await fs.readFile(destIndexPath, {encoding: 'utf-8'});
    if (currentContent !== templateBody) {
        fs.writeFile(destIndexPath, templateBody);
    }
}

function getTemplateTag(body) {
    let startIndex = body.indexOf('{{');
    if (startIndex === -1) {
        return null;
    }
    let endIndex = body.indexOf('}}');
    let tag = body.substring(startIndex, endIndex + 2);
    return tag;
}

async function updateStyleFile() {
    let bundleContent = await fs.readFile(destStylePath, { encoding: 'utf-8' });
    let currentContent = await getCssFilesContent(srcStylesPath);
    if (bundleContent !== currentContent) {
        fs.writeFile(destStylePath, currentContent);
    }
}

async function getCssFilesContent(src) {
    let dirContent = await getDirContent(src);
    let files = dirContent.filter(el => !el.isDirectory());
    let filesName = files.map(file => file.name);
    let cssFiles = filesName.filter(filename => path.extname(filename) === '.css');
    let filesContent = '';
    for (let i = 0; i < cssFiles.length; i++) {
        let filePath = path.join(src, cssFiles[i]);
        filesContent += await fs.readFile(filePath, {encoding: 'utf-8'});
        filesContent += '\n';
    }
    return filesContent;
}

function getDirContent(src) {
    let option = { withFileTypes: true };
    return fs.readdir(src, option);
}

async function updateAssetsDir() {
    await removeExtra(srcAssetsPath, destAssetsPath);
    await dublicateMis(srcAssetsPath, destAssetsPath);
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
        let src4copy = path.join(srcPath, element.name);
        let dest4copy = path.join(destPath, element.name);
        if (!isElementContain(destElements, element)) {
            if (element.isDirectory()) {
                fs.mkdir(dest4copy);
                dublicateMis(src4copy, dest4copy);
            } else {
                fs.copyFile(src4copy, dest4copy);
            }
        } else {
            if (element.isDirectory()) {
                dublicateMis(src4copy, dest4copy);
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