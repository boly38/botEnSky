/**
 * 🧭 BotEnSky Navigation
 * Mobile menu, smooth scroll, sticky header
 */

class Navigation {
  constructor() {
    this.header = document.querySelector('[data-header]');
    this.mobileMenuToggle = document.querySelector('[data-mobile-menu-toggle]');
    this.mobileMenu = document.querySelector('[data-mobile-menu]');
    this.mobileMenuOverlay = document.querySelector('[data-mobile-menu-overlay]');
    this.navLinks = document.querySelectorAll('[data-nav-link]');
    this.isMobileMenuOpen = false;
    this.lastScrollY = window.scrollY;
    
    this.init();
  }

  init() {
    this.setupStickyHeader();
    this.setupMobileMenu();
    this.setupSmoothScroll();
    this.setupActiveLink();
    this.handleResize();
    this.handleInitialHash();
  }

  /**
   * Handle hash on page load
   * Example: http://localhost:5000/#faq or #faq-identification
   */
  handleInitialHash() {
    const hash = window.location.hash;
    if (!hash) return;

    // Check if hash is a main section (logs, principes, faq)
    const section = hash.substring(1).split('-')[0]; // Get 'faq' from '#faq-identification'
    if (window.BesContent && window.BesContent.contentIds.includes(section)) {
      // Navigate to the section
      setTimeout(() => {
        window.BesContent.toggleContent(section);
      }, 100);
    }
  }

  /**
   * Sticky header avec effet scroll
   */
  setupStickyHeader() {
    if (!this.header) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;

      // Add 'scrolled' class after 50px
      if (scrollY > 50) {
        this.header.classList.add('scrolled');
      } else {
        this.header.classList.remove('scrolled');
      }

      this.lastScrollY = scrollY;
    });
  }

  /**
   * Mobile menu toggle
   */
  setupMobileMenu() {
    if (!this.mobileMenuToggle || !this.mobileMenu) return;

    // Toggle button click
    this.mobileMenuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleMobileMenu();
    });

    // Overlay click to close
    if (this.mobileMenuOverlay) {
      this.mobileMenuOverlay.addEventListener('click', () => {
        this.closeMobileMenu();
      });
    }

    // Close on link click
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (this.isMobileMenuOpen) {
          this.closeMobileMenu();
        }
      });
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Open mobile menu
   */
  openMobileMenu() {
    this.isMobileMenuOpen = true;
    this.mobileMenu.classList.add('open');
    if (this.mobileMenuOverlay) {
      this.mobileMenuOverlay.classList.add('open');
    }
    this.mobileMenuToggle.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent scroll

    // Update aria
    this.mobileMenuToggle.setAttribute('aria-expanded', 'true');
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.mobileMenu.classList.remove('open');
    if (this.mobileMenuOverlay) {
      this.mobileMenuOverlay.classList.remove('open');
    }
    this.mobileMenuToggle.classList.remove('open');
    document.body.style.overflow = ''; // Restore scroll

    // Update aria
    this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
  }

  /**
   * Smooth scroll pour les ancres
   */
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        
        // Ignore empty hash
        if (href === '#' || href === '#!') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          
          // Calculate offset (header height)
          const headerHeight = this.header ? this.header.offsetHeight : 0;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update URL without jumping
          if (history.pushState) {
            history.pushState(null, null, href);
          }
        }
      });
    });
  }

  /**
   * Active link sur section visible
   */
  setupActiveLink() {
    // Simple implementation - can be enhanced with Intersection Observer
    window.addEventListener('scroll', () => {
      // Get current scroll position
      const scrollPos = window.scrollY + 100;

      // Check which section is in view
      document.querySelectorAll('[id]').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          // Remove active from all
          this.navLinks.forEach(link => {
            link.classList.remove('active');
          });

          // Add active to current
          const activeLink = document.querySelector(`[data-nav-link][href="#${sectionId}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    window.addEventListener('resize', () => {
      // Close mobile menu on desktop
      if (window.innerWidth >= 768 && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }
}

// Content toggle functions (from original code - refactored)
window.BesContent = {
  contentIds: ["logs", "principes", "faq"],
  
  toggleContent: function(content) {
    this.contentIds.forEach(id => {
      const element = document.getElementById(id);
      const menuLink = document.getElementById(`${id}-menu`);
      
      if (id === content) {
        if (element) element.style.display = 'block';
        if (menuLink) menuLink.classList.add('active');
      } else {
        if (element) element.style.display = 'none';
        if (menuLink) menuLink.classList.remove('active');
      }
    });
  },

  toggleLogDateContent: function(content, logDateIds) {
    if (!logDateIds || logDateIds.length === 0) return;
    
    logDateIds.forEach(id => {
      const element = document.getElementById(id);
      const menuLink = document.getElementById(`${id}-menu`);
      
      if (id === content) {
        if (element) element.style.display = 'block';
        if (menuLink) menuLink.classList.add('active');
      } else {
        if (element) element.style.display = 'none';
        if (menuLink) menuLink.classList.remove('active');
      }
    });
  }
};

// Language switcher
window.toggleLang = function(lang) {
  if (['fr', 'en'].includes(lang)) {
    window.location.href = "?lang=" + lang;
  }
};

// Initialize navigation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new Navigation();
  });
} else {
  window.navigation = new Navigation();
}

// Export for modules (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navigation;
}
