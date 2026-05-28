/**
 * Test raw v.gd API
 *
 * Test direct du provider v.gd (fallback provider pour is.gd)
 * API: https://v.gd/create.php
 *
 * Note: v.gd est un service compatible avec is.gd, API similaire
 *
 * Utilisation:
 *   node tests/manual/url_shortener/raw_vgd.js
 */

import https from 'https';
import { URL } from 'url';

const TEST_URL = 'https://avibase.bsc-eoc.org/species.jsp?lang=EN&avibaseid=0C1EFC9B&sec=flickr';

/**
 * Fournit une fonction de test brute pour v.gd
 * @param {string} urlToShorten URL à raccourcir
 * @returns {Promise<Object>} Réponse avec statusCode, statusMessage, headers, body
 */
function fetchVgd(urlToShorten) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://v.gd/create.php?format=simple&url=${encodeURIComponent(urlToShorten)}`;

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
  console.log('🧪 Test raw v.gd API (Node.js native HTTPS)');
  console.log('==============================================\n');
  console.log(`URL à raccourcir: ${TEST_URL}\n`);

  try {
    console.log('🔄 Appel API v.gd...');
    const response = await fetchVgd(TEST_URL);

    console.log(`Status HTTP: ${response.statusCode} ${response.statusMessage}`);
    console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
    console.log(`Response: ${response.body}\n`);

    if (response.statusCode === 200) {
      if (response.body.startsWith('https://v.gd/')) {
        console.log(`✅ Succès - URL raccourcie: ${response.body}`);
      } else if (response.body.startsWith('Error')) {
        console.log(`❌ Erreur API: ${response.body}`);
        console.log('(v.gd retourne 200 mais une erreur métier)');
      } else {
        console.log(`⚠️  Réponse inattendue: ${response.body}`);
      }
    } else if (response.statusCode === 403) {
      console.log('❌ Erreur 403 Forbidden');
      console.log('(v.gd peut aussi bloquer les requêtes sans User-Agent)');
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

