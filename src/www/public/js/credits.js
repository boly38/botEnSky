/**
 * 💝 BotEnSky Credits Page JavaScript
 * Initialize Lucide icons when credits section is shown
 */

class CreditsPage {
  constructor() {
    this.creditsSection = document.getElementById('credits');
    this.init();
  }

  init() {
    // When credits section becomes visible, reinitialize Lucide icons
    if (this.creditsSection) {
      // Observe when section becomes visible
      const observer = new MutationObserver(() => {
        const isVisible = this.creditsSection.style.display !== 'none';
        if (isVisible && window.lucide) {
          window.lucide.createIcons();
        }
      });

      observer.observe(this.creditsSection, {
        attributes: true,
        attributeFilter: ['style']
      });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only init if credits section exists
    if (document.getElementById('credits')) {
      window.creditsPage = new CreditsPage();
    }
  });
} else {
  if (document.getElementById('credits')) {
    window.creditsPage = new CreditsPage();
  }
}

// Export for modules (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CreditsPage;
}

