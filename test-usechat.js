require('http').createServer((req, res) => {
  if (req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('HEADERS:', req.headers);
      console.log('BODY:', body);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('0:"Hello"\n');
    });
  }
}).listen(3001);
