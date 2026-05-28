/**
 * Test manuel du service UrlShortener
 *
 * Teste le service complet avec fallback multi-providers
 *
 * Utilisation:
 *   node tests/manual/url_shortener/service.js
 */

import { buildShortUrlWithText } from '../../../src/lib/UrlShortener.js';

const TEST_URLS = [
  'https://avibase.bsc-eoc.org/species.jsp?lang=EN&avibaseid=0C1EFC9B&sec=flickr',
  'https://unsplash.com/collections/1395868',
  'https://example.com/very/long/url/that/needs/shortening',
];

const logger = {
  debug: (...args) => console.log('[DEBUG]', ...args),
  info: (...args) => console.log('[INFO] ', ...args),
  warn: (...args) => console.warn('[WARN] ', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

async function testUrlShortenerService() {
  console.log('🧪 Test du service UrlShortener (multi-provider)');
  console.log('================================================\n');

  for (const testUrl of TEST_URLS) {
    console.log(`URL: ${testUrl}`);

    try {
      const prefix = 'Lien court: ';
      const result = await buildShortUrlWithText(logger, testUrl, prefix);

      console.log(`Résultat: ${result}`);

      // Analyse du résultat
      const shortPart = typeof result === 'string' ? result.replace(prefix, '').trim() : '';

      if (shortPart.startsWith('https://')) {
        if (shortPart.startsWith('https://is.gd/') || shortPart.startsWith('https://v.gd/')) {
          console.log('✅ Raccourcissement OK (provider réussi).\n');
        } else if (shortPart === testUrl) {
          console.log('⚠️  Fallback détecté: tous les providers indisponibles.\n');
        } else {
          console.log(`✅ Raccourcissement via provider alternatif.\n`);
        }
      } else {
        console.log('❌ Résultat invalide détecté.\n');
      }
    } catch (error) {
      console.error(`❌ Erreur lors du raccourcissement: ${error.message}\n`);
    }
  }

  console.log('\n================================================');
  console.log('Résumé: Service testé avec tous les providers disponibles');
}

testUrlShortenerService().catch((error) => {
  console.error('Erreur pendant le test manuel:', error);
  process.exitCode = 1;
});

