const fs = require('fs');
const path = require('path');
const { stdin } = process;


const FILE_NAME = "text.txt";
const EXIT_WORD = 'exit';
const filePath = path.join(__dirname, FILE_NAME);
const option = {
    flags: 'a',
    encoding: null,
    mode: 0666
}
let output;

greeting();
handleEnteredText();
exitFunc();

function greeting() {
    console.log("Hello! Enter text please.");
}

function handleEnteredText() {
    stdin.on('data', data => {
        let text = data.toString().trim();
        if (text === EXIT_WORD) {
            process.exit(0);
        }
        writeToFile(text);
    });
}

async function writeToFile(text) {
    if (!output) {
        output = await fs.createWriteStream(filePath, option);
    }
    await output.write(`${text}\n`);
}

function exitFunc() {
    process.on('SIGINT', () => {
        process.exit();
    });
    process.on('exit', () => {
        console.log('Bye, Bye!');
    });
}