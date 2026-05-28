import axios from 'axios';
import { buildShortUrlWithText } from '../../src/lib/UrlShortener.js';

const TEST_URL = 'https://avibase.bsc-eoc.org/species.jsp?lang=EN&avibaseid=0C1EFC9B&sec=flickr';

const logger = {
  warn: (...args) => console.warn('[warn]', ...args),
};

async function testIsGdDirectly() {
  console.log('\n=== Test direct is.gd API ===');
  const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(TEST_URL)}`;
  console.log('Appel:', apiUrl);

  try {
    const response = await axios.get(apiUrl, { timeout: 5000 });
    console.log('Status HTTP:', response.status);
    console.log('Headers:', response.headers);
    console.log('Response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Status HTTP (erreur):', error.response.status);
      console.log('Status text:', error.response.statusText);
      console.log('Headers (erreur):', error.response.headers);
      console.log('Response data (erreur):', error.response.data);
    } else {
      console.log('Erreur reseau/timeout:', error.message);
    }
  }
}

async function main() {
  console.log('Test manuel UrlShortener (is.gd)');
  console.log('URL source:', TEST_URL);

  await testIsGdDirectly();

  console.log('\n=== Test via buildShortUrlWithText ===');
  const prefix = 'Lien court: ';
  const result = await buildShortUrlWithText(logger, TEST_URL, prefix);

  console.log('Resultat:');
  console.log(result);

  const shortPart = typeof result === 'string' ? result.replace(prefix, '').trim() : '';
  const isValidShortUrl = /^https:\/\/is\.gd\//.test(shortPart);

  if (isValidShortUrl) {
    console.log('✅ Raccourcissement OK.');
    return;
  }

  if (shortPart === TEST_URL) {
    console.log('⚠️  Fallback detecte: is.gd probablement indisponible ou en erreur.');
    return;
  }

  console.log('❌ Erreur API is.gd detectee (reponse non URL):', shortPart);
  console.log('Le service is.gd semble degrade pour cette requete.');
}

main().catch((error) => {
  console.error('Erreur pendant le test manuel:', error);
  process.exitCode = 1;
});
