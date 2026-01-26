/**
 * 🖼️ Lightbox Manager
 * Gère l'affichage agrandi des images au click
 */

class LightboxManager {
  constructor() {
    this.lightbox = null;
    this.init();
  }

  init() {
    // Créer l'overlay lightbox
    this.createLightbox();

    // Attacher les événements aux images post
    this.attachImageListeners();

    // Event listeners globaux
    this.attachGlobalListeners();
  }

  createLightbox() {
    // Créer le HTML de la lightbox
    const lightboxHTML = `
      <div class="bes-lightbox" id="besLightbox">
        <button class="bes-lightbox-close" aria-label="Fermer" title="Fermer (ESC)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="bes-lightbox-content">
          <div class="bes-lightbox-loading"></div>
          <img class="bes-lightbox-image" src="" alt="" style="display: none;">
          <div class="bes-lightbox-caption" style="display: none;"></div>
        </div>
      </div>
    `;

    // Ajouter au body
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    this.lightbox = document.getElementById('besLightbox');
    this.image = this.lightbox.querySelector('.bes-lightbox-image');
    this.caption = this.lightbox.querySelector('.bes-lightbox-caption');
    this.loading = this.lightbox.querySelector('.bes-lightbox-loading');
    this.closeBtn = this.lightbox.querySelector('.bes-lightbox-close');
  }

  attachImageListeners() {
    // Délégation d'événements sur le document pour capturer tous les clics sur images
    document.addEventListener('click', (e) => {
      const target = e.target;

      // Vérifier si c'est une image de post
      if (target.classList.contains('post-image')) {
        e.preventDefault();
        const link = target.closest('a');
        const imageUrl = link ? link.href : target.src;
        const imageAlt = target.alt || target.title || '';
        this.open(imageUrl, imageAlt);
      }
    });
  }

  attachGlobalListeners() {
    // Fermer au click sur overlay
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) {
        this.close();
      }
    });

    // Fermer au click sur bouton close
    this.closeBtn.addEventListener('click', () => {
      this.close();
    });

    // Fermer avec ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.lightbox.classList.contains('active')) {
        this.close();
      }
    });
  }

  open(imageUrl, caption = '') {
    // Umami tracking: Track lightbox image views
    if (window.umami) {
      window.umami.track('lightbox-open', {
        imageUrl: imageUrl.substring(imageUrl.lastIndexOf('/') + 1) // Just filename for privacy
      });
    }

    // Reset état
    this.image.style.display = 'none';
    this.caption.style.display = 'none';
    this.loading.style.display = 'block';

    // Afficher lightbox
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Bloquer scroll body

    // Charger image
    const img = new Image();
    img.onload = () => {
      this.image.src = imageUrl;
      this.image.alt = caption;
      this.loading.style.display = 'none';
      this.image.style.display = 'block';

      // Afficher caption si présent
      if (caption) {
        this.caption.textContent = caption;
        this.caption.style.display = 'block';
      }
    };
    img.onerror = () => {
      this.loading.style.display = 'none';
      this.caption.textContent = 'Erreur de chargement de l\'image';
      this.caption.style.display = 'block';
    };
    img.src = imageUrl;
  }

  close() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restaurer scroll

    // Reset après animation
    setTimeout(() => {
      this.image.src = '';
      this.caption.textContent = '';
    }, 300);
  }
}

// Initialiser au chargement DOM
document.addEventListener('DOMContentLoaded', () => {
  window.besLightbox = new LightboxManager();
});
