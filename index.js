const express = require('express');
const multer = require('multer');
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const args = require('minimist')(process.argv.slice(2));

const app = express();

var port = '3000';
var uploaddir = './uploads'
var downloaddir = './downloads'
var credentials = './credentials/home-vision-api.json'

if (args['port']) {
    port = args['port'];
}

if (args['uploaddir']) {
    uploaddir = args['uploaddir'];
}

if (args['downloaddir']) {
    downloaddir = args['downloaddir'];
}

if (args['credentials']) {
    credentials = args['credentials'];
}

const uploadspath = uploaddir;
const downloadspath = downloaddir;
const upload = multer({ dest: uploadspath });

console.log('File upload directory is ' + uploadspath);
console.log('File download directory is ' + downloadspath);
console.log('Google cloud vision API credentials: ' + credentials);

try {

    if (!fs.existsSync(downloadspath)) {
        fs.mkdirSync(downloadspath);
    }

    app.enable('trust proxy');
    
    app.use(express.static('public'));

    app.post('/upload', upload.single('image'), async(req, res) => {
        const inputFilename = req.file.filename;
        const outputFilename = path.parse(req.file.originalname).name + '.txt';
        const language = req.body.language || '';

        console.log('File ' + inputFilename + ' received for conversion');

        var command = `./imagetotext -i "${uploadspath}/${inputFilename}" -o "${downloadspath}/${outputFilename}" -c "${credentials}"`;

        if (language) {
            command += ` -l ${language}`;
        }

        shell.exec(command, function(code) {
            if (code === 0) {
                console.log('File ' + inputFilename + ' converted to text');
                try {
                    const text = fs.readFileSync(downloadspath + '/' + outputFilename, 'utf8');
                    const downloadLink = req.protocol + '://' + req.hostname + '/download/' + outputFilename;

                    res.send({
                        success: true,
                        message: 'Text extracted successfully',
                        downloadLink: downloadLink,
                        text: text
                    });

                    fs.unlink(uploadspath + '/' + inputFilename, (err) => {
                        if (err) throw err;
                        console.log(uploadspath + '/' + inputFilename + ' is deleted');
                    });
                } catch (error) {
                    console.error(error);
                    res.status(500).send({
                        success: false,
                        message: 'Error saving text file',
                    });
                }

            } else {
                console.log('File ' + inputFilename + ' conversion to text failed');
                res.status(500).send({
                    success: false,
                    message: 'Error extracting text',
                });
            }
        });
    });

    app.get('/download/:filename', (req, res) => {
        const filename = req.params.filename;
        const filePath = `./${downloadspath}/${filename}`;

        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).send('File not found');
        }
    });

    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname, '/index.html'));
    });

    app.listen(port, () => {
        console.log('Server started on port ' + port);
    });

} catch (error) {
    console.error(error);
}
