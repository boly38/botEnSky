import https from 'https';
import { URL } from 'url';

const TEST_URL = 'https://avibase.bsc-eoc.org/species.jsp?lang=EN&avibaseid=0C1EFC9B&sec=flickr';

function fetchIsGd(urlToShorten) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(urlToShorten)}`;

    const url = new URL(apiUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data.trim(),
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('Raw test is.gd API (Node.js native, 0 deps)');
  console.log('URL:', TEST_URL);
  console.log('');

  try {
    const response = await fetchIsGd(TEST_URL);

    console.log('Status:', response.statusCode, response.statusMessage);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Response:', response.body);
    console.log('');

    if (response.statusCode === 200) {
      if (response.body.startsWith('https://is.gd/')) {
        console.log('✅ Success - shortened URL:', response.body);
      } else if (response.body.startsWith('Error')) {
        console.log('❌ API error:', response.body);
      } else {
        console.log('⚠️  Unexpected response:', response.body);
      }
    } else {
      console.log('❌ HTTP error code:', response.statusCode);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

main();

