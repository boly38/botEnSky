/**
 * 🌊 BotEnSky Scroll Animations
 * Intersection Observer for fade-in effects
 */

class ScrollAnimations {
  constructor() {
    this.elements = [];
    this.observer = null;
    this.init();
  }

  /**
   * Initialize scroll animations
   */
  init() {
    // Find all elements with scroll-animate class
    this.elements = document.querySelectorAll('.scroll-animate');

    if (this.elements.length === 0) return;

    // Create Intersection Observer
    const options = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.1 // Trigger when 10% visible
    };

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      options
    );

    // Observe all elements
    this.elements.forEach(element => {
      this.observer.observe(element);
    });
  }

  /**
   * Handle intersection changes
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add 'in-view' class when element enters viewport
        entry.target.classList.add('in-view');
        
        // Optional: Stop observing after animation (performance)
        // Uncomment if you want one-time animations
        // this.observer.unobserve(entry.target);
      } else {
        // Optional: Remove class when element leaves (for repeat animations)
        // entry.target.classList.remove('in-view');
      }
    });
  }

  /**
   * Manually trigger animation for an element
   */
  animateElement(element) {
    if (element) {
      element.classList.add('in-view');
    }
  }

  /**
   * Reset animation for an element
   */
  resetElement(element) {
    if (element) {
      element.classList.remove('in-view');
    }
  }

  /**
   * Destroy observer (cleanup)
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialize scroll animations when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.scrollAnimations = new ScrollAnimations();
  });
} else {
  window.scrollAnimations = new ScrollAnimations();
}

// Export for modules (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollAnimations;
}
