const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Handle API proxy requests
    if (parsedUrl.pathname === '/api/properties') {
        console.log('API proxy request received');
        // Proxy the external API request
        const apiUrl = 'https://ivvdata.algarvevillaclub.com/datafeed/properties.json?type=saleonly';

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            },
            timeout: 10000, // 10 second timeout
            rejectUnauthorized: false // Allow self-signed certificates if needed
        };

        const apiReq = https.get(apiUrl, options, (apiRes) => {
            console.log(`API response status: ${apiRes.statusCode}`);
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                console.log(`API response received, length: ${data.length}`);
                // Set CORS headers
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });
                res.end(data);
            });
        });

        apiReq.on('error', (err) => {
            console.error('API proxy error:', err.message);
            res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: 'Failed to fetch properties', details: err.message }));
        });

        apiReq.on('timeout', () => {
            console.error('API request timeout');
            apiReq.destroy();
            res.writeHead(504, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: 'API request timeout' }));
        });

        return;
    }

    // Handle static file requests
    let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);

    // Security: prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Internal server error');
            }
            return;
        }

        // Set content type based on file extension
        const ext = path.extname(filePath);
        let contentType = 'text/plain';
        switch (ext) {
            case '.html':
                contentType = 'text/html';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.js':
                contentType = 'text/javascript';
                break;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API proxy available at http://localhost:${PORT}/api/properties`);
});