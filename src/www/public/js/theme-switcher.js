/**
 * 🌓 BotEnSky Theme Switcher
 * Dark/Light mode avec persistence localStorage
 */

class ThemeSwitcher {
  constructor() {
    this.theme = this.getInitialTheme();
    this.init();
  }

  /**
   * Détermine le thème initial (localStorage > système > default light)
   */
  getInitialTheme() {
    // 1. Check localStorage
    const stored = localStorage.getItem('bes-theme');
    if (stored) return stored;

    // 2. Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // 3. Default
    return 'light';
  }

  /**
   * Initialisation
   */
  init() {
    // Apply theme
    this.applyTheme(this.theme, false);

    // Listen to system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually chosen
        if (!localStorage.getItem('bes-theme')) {
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }

    // Setup toggle buttons
    this.setupToggleButtons();
  }

  /**
   * Applique le thème au DOM
   */
  applyTheme(theme, animate = true) {
    const html = document.documentElement;
    const body = document.body;

    // Add transition class for smooth color change
    if (animate) {
      body.classList.add('theme-transitioning');
    }

    // Set theme attribute
    body.setAttribute('data-theme', theme);
    html.setAttribute('data-theme', theme);

    // Update toggle buttons state
    this.updateToggleButtons(theme);

    // Remove transition class after animation
    if (animate) {
      setTimeout(() => {
        body.classList.remove('theme-transitioning');
      }, 300);
    }

    this.theme = theme;
  }

  /**
   * Change le thème
   */
  setTheme(theme, persist = true) {
    this.applyTheme(theme, true);

    // Save to localStorage
    if (persist) {
      localStorage.setItem('bes-theme', theme);
    }

    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  }

  /**
   * Toggle entre dark/light
   */
  toggle() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Setup des boutons toggle
   */
  setupToggleButtons() {
    const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
    
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
    });
  }

  /**
   * Met à jour l'état visuel des boutons
   */
  updateToggleButtons(theme) {
    const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
    
    toggleButtons.forEach(button => {
      const icon = button.querySelector('[data-theme-icon]');
      if (icon) {
        // Update icon (sun/moon)
        if (theme === 'dark') {
          icon.setAttribute('data-lucide', 'sun');
        } else {
          icon.setAttribute('data-lucide', 'moon');
        }
        // Reinitialize Lucide icons
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }

      // Update aria-label for accessibility
      button.setAttribute('aria-label', 
        theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
      );
    });
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.theme;
  }
}

// Initialize theme switcher when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
  });
} else {
  window.themeSwitcher = new ThemeSwitcher();
}

// Export for modules (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeSwitcher;
}
