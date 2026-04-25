const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const indexPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const logPath = path.join('/tmp', 'sample-app.log');

const log = (entry) => {
  const line = `${new Date().toISOString()} - ${entry}\n`;
  fs.appendFile(logPath, line, (err) => {
    if (err) {
      console.error('Failed to write log:', err);
    }
  });
};

const sendResponse = (res, statusCode, headers, body) => {
  res.writeHead(statusCode, headers);
  res.end(body);
};

const sendHtml = (res) =>
  sendResponse(res, 200, { 'Content-Type': 'text/html; charset=utf-8' }, html);
const sendPlainOk = (res) =>
  sendResponse(res, 200, { 'Content-Type': 'text/plain; charset=utf-8' }, 'OK');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      if (req.url === '/') {
        log(`Received message: ${body}`);
      } else if (req.url === '/scheduled') {
        log(
          `Received task ${req.headers['x-aws-sqsd-taskname']} scheduled at ${req.headers['x-aws-sqsd-scheduled-at']}`,
        );
      }

      sendPlainOk(res);
    });

    req.on('error', (err) => {
      console.error('Request error:', err);
      sendResponse(
        res,
        400,
        { 'Content-Type': 'text/plain; charset=utf-8' },
        'Bad Request',
      );
    });
  } else {
    sendHtml(res);
  }
});

server.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}/`);
});
