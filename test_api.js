import https from 'https';

const data = JSON.stringify({ rawText: "Teste de curriculo" });

const options = {
  hostname: 'ais-pre-j4k5cpsqlblim4ws45rnx4-5491150004.europe-west3.run.app',
  port: 443,
  path: '/',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let resData = '';
  res.on('data', d => {
    resData += d;
  });
  res.on('end', () => {
      console.log('Response body:', resData);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
