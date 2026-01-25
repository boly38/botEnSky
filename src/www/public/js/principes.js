/**
 * 📚 BotEnSky Principes Page JavaScript
 * Scroll-spy for TOC, back-to-top button with progress
 */

class PrincipesPage {
  constructor() {
    this.tocLinks = document.querySelectorAll('[data-toc-link]');
    this.sections = [];
    this.backToTopBtn = document.querySelector('[data-back-to-top]');
    this.progressCircle = this.backToTopBtn?.querySelector('circle');
    this.currentActive = null;
    
    this.init();
  }

  init() {
    this.setupSections();
    this.setupScrollSpy();
    this.setupBackToTop();
    this.setupSmoothScroll();
  }

  /**
   * Setup sections array from TOC links
   */
  setupSections() {
    this.tocLinks.forEach(link => {
      const href = link.getAttribute('href');
      const section = document.querySelector(href);
      if (section) {
        this.sections.push({
          id: href.substring(1),
          element: section,
          link: link
        });
      }
    });
  }

  /**
   * Scroll spy for TOC active state
   */
  setupScrollSpy() {
    if (this.sections.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Active when in middle third of viewport
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = this.sections.find(s => s.element === entry.target);
          if (section) {
            this.setActiveLink(section.link);
          }
        }
      });
    }, observerOptions);

    this.sections.forEach(section => {
      observer.observe(section.element);
    });
  }

  /**
   * Set active link in TOC
   */
  setActiveLink(activeLink) {
    if (this.currentActive === activeLink) return;

    // Remove active from all
    this.tocLinks.forEach(link => {
      link.classList.remove('active');
    });

    // Add active to current
    activeLink.classList.add('active');
    this.currentActive = activeLink;
  }

  /**
   * Setup back to top button
   */
  setupBackToTop() {
    if (!this.backToTopBtn) return;

    // Show/hide on scroll + progress circle
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      // Show button after 300px scroll
      if (scrollTop > 300) {
        this.backToTopBtn.classList.add('visible');
      } else {
        this.backToTopBtn.classList.remove('visible');
      }

      // Update progress circle
      if (this.progressCircle) {
        const circumference = 2 * Math.PI * 26; // r=26
        const offset = circumference - (scrollPercent / 100 * circumference);
        this.progressCircle.style.strokeDashoffset = offset;
      }
    });

    // Click to scroll to top
    this.backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Smooth scroll for all anchor links
   */
  setupSmoothScroll() {
    this.tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        const target = document.querySelector(href);
        
        if (target) {
          const headerHeight = document.querySelector('[data-header]')?.offsetHeight || 0;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update URL
          if (history.pushState) {
            history.pushState(null, null, href);
          }
        }
      });
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only init if on principes page
    if (document.getElementById('principes')) {
      window.principesPage = new PrincipesPage();
    }
  });
} else {
  if (document.getElementById('principes')) {
    window.principesPage = new PrincipesPage();
  }
}

// Export for modules (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrincipesPage;
}
