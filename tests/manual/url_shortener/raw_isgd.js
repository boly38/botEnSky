/**
 * Test raw is.gd API
 *
 * Test direct du provider is.gd (Node.js native HTTPS, zéro dépendances)
 *
 * Utilisation:
 *   node tests/manual/url_shortener/raw_isgd.js
 */

import https from 'https';
import { URL } from 'url';

const TEST_URL = 'https://avibase.bsc-eoc.org/species.jsp?lang=EN&avibaseid=0C1EFC9B&sec=flickr';

/**
 * Fournit une fonction de test brute pour is.gd
 * @param {string} urlToShorten URL à raccourcir
 * @returns {Promise<Object>} Réponse avec statusCode, statusMessage, headers, body
 */
function fetchIsGd(urlToShorten) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(urlToShorten)}`;

    const url = new URL(apiUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      timeout: 5000,
      // Add User-Agent to match service behavior
      headers: {
        'User-Agent': 'botEnSky/test (Bluesky bot manual test)',
      },
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
  console.log('🧪 Test raw is.gd API (Node.js native HTTPS)');
  console.log('=============================================\n');
  console.log(`URL à raccourcir: ${TEST_URL}\n`);

  try {
    console.log('🔄 Appel API is.gd...');
    const response = await fetchIsGd(TEST_URL);

    console.log(`Status HTTP: ${response.statusCode} ${response.statusMessage}`);
    console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
    console.log(`Response: ${response.body}\n`);

    if (response.statusCode === 200) {
      if (response.body.startsWith('https://is.gd/')) {
        console.log(`✅ Succès - URL raccourcie: ${response.body}`);
      } else if (response.body.startsWith('Error')) {
        console.log(`❌ Erreur API: ${response.body}`);
        console.log('(is.gd retourne 200 mais une erreur métier)');
      } else {
        console.log(`⚠️  Réponse inattendue: ${response.body}`);
      }
    } else if (response.statusCode === 403) {
      console.log('❌ Erreur 403 Forbidden (CloudFlare?)');
      console.log('Recommandation: utiliser le fallback TinyURL');
    } else {
      console.log(`❌ Erreur HTTP ${response.statusCode}`);
    }
  } catch (error) {
    console.error(`❌ Requête échouée: ${error.message}`);
    if (error.message.includes('timeout')) {
      console.log('Recommandation: vérifier la connectivité réseau');
    }
  }
}

main();

