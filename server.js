const https = require('https');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const PORT = 8080;

// Define certificate and key file paths
const certFile = 'server.cert';
const keyFile = 'server.key';

console.log('Starting server setup...');

// Generate certificates if they don't exist
if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
  console.log('Generating self-signed certificates...');
  const pems = selfsigned.generate(null, { days: 365 });
  fs.writeFileSync(certFile, pems.cert);
  fs.writeFileSync(keyFile, pems.private);
  console.log('Certificates generated.');
} else {
  console.log('Certificates already exist.');
}

const options = {
  key: fs.readFileSync(keyFile),
  cert: fs.readFileSync(certFile)
};

console.log('Creating HTTPS server...');

const server = https.createServer(options, (req, res) => {
  console.log(`Request for ${req.url} received.`);
  let filePath = path.join(__dirname, req.url === '/' ? '/SpaceShooting.html' : req.url);
  const ext = path.extname(filePath);

  // Set the correct content type based on the file extension
  const contentType = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.css': 'text/css',
    '.ico': 'image/x-icon',
  }[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.log(`Error: ${err.code} for file ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      console.log(`Serving file: ${filePath}`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Start listening on the specified port
server.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
