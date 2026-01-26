/**
 * ❓ BotEnSky FAQ Page JavaScript
 * Accordion expand/collapse, search with highlight
 */

class FaqPage {
  constructor() {
    this.faqItems = document.querySelectorAll('[data-faq-item]');
    this.searchInput = document.querySelector('[data-faq-search]');
    this.emptyState = document.querySelector('[data-faq-empty]');
    this.searchTimeout = null;
    
    this.init();
  }

  init() {
    this.setupAccordion();
    this.setupSearch();
    this.handleDeepLink();
  }

  /**
   * Setup accordion expand/collapse
   */
  setupAccordion() {
    this.faqItems.forEach((item, index) => {
      const question = item.querySelector('[data-faq-question]');
      const title = item.querySelector('[data-faq-title]');

      question.addEventListener('click', () => {
        // Toggle current item
        const isOpen = item.classList.contains('open');
        
        // Umami tracking: Track FAQ question clicks
        if (window.umami) {
          const questionText = title?.textContent.trim() || `FAQ ${index + 1}`;
          window.umami.track('faq-question', {
            question: questionText,
            action: isOpen ? 'close' : 'open'
          });
        }

        // Optional: Close other items (accordion mode)
        // Uncomment below for single-open behavior
        // this.faqItems.forEach(otherItem => {
        //   if (otherItem !== item) {
        //     otherItem.classList.remove('open');
        //   }
        // });
        
        // Toggle current
        if (isOpen) {
          item.classList.remove('open');
        } else {
          item.classList.add('open');
        }
      });
    });
  }

  /**
   * Setup search functionality
   */
  setupSearch() {
    if (!this.searchInput) return;

    this.searchInput.addEventListener('input', (e) => {
      // Debounce search
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        const query = e.target.value;
        this.performSearch(query);

        // Umami tracking: Track FAQ searches (only non-empty queries)
        if (query.trim() && window.umami) {
          window.umami.track('faq-search', {
            query: query.trim()
          });
        }
      }, 300);
    });
  }

  /**
   * Perform search and filter FAQ items
   */
  performSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    let visibleCount = 0;

    this.faqItems.forEach(item => {
      // Remove previous highlights
      this.removeHighlights(item);

      if (searchTerm === '') {
        // Show all when search is empty
        item.classList.remove('hidden');
        item.classList.remove('open');
        visibleCount++;
      } else {
        // Search in title and content
        const title = item.querySelector('[data-faq-title]');
        const content = item.querySelector('[data-faq-content]');
        
        const titleText = title.textContent.toLowerCase();
        const contentText = content.textContent.toLowerCase();
        
        const matches = titleText.includes(searchTerm) || contentText.includes(searchTerm);
        
        if (matches) {
          item.classList.remove('hidden');
          item.classList.add('open'); // Auto-expand matching items
          visibleCount++;
          
          // Highlight matches
          this.highlightText(title, searchTerm);
          this.highlightText(content, searchTerm);
        } else {
          item.classList.add('hidden');
          item.classList.remove('open');
        }
      }
    });

    // Show/hide empty state
    if (visibleCount === 0 && searchTerm !== '') {
      this.emptyState?.classList.add('visible');
    } else {
      this.emptyState?.classList.remove('visible');
    }
  }

  /**
   * Highlight search term in text
   */
  highlightText(element, searchTerm) {
    if (!searchTerm) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach(node => {
      const text = node.nodeValue;
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes(searchTerm)) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let index;

        while ((index = lowerText.indexOf(searchTerm, lastIndex)) !== -1) {
          // Add text before match
          if (index > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.substring(lastIndex, index))
            );
          }

          // Add highlighted match
          const mark = document.createElement('mark');
          mark.className = 'bes-highlight';
          mark.textContent = text.substring(index, index + searchTerm.length);
          fragment.appendChild(mark);

          lastIndex = index + searchTerm.length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex))
          );
        }

        node.parentNode.replaceChild(fragment, node);
      }
    });
  }

  /**
   * Remove all highlights from an element
   */
  removeHighlights(element) {
    const highlights = element.querySelectorAll('mark.bes-highlight');
    highlights.forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize(); // Merge adjacent text nodes
    });
  }

  /**
   * Handle deep linking (URL hash)
   * Example: https://botensky.verymad.net/#faq-identification
   */
  handleDeepLink() {
    const hash = window.location.hash;
    if (hash) {
      const targetItem = document.querySelector(hash);
      if (targetItem && targetItem.hasAttribute('data-faq-item')) {
        // Scroll to item and open it
        setTimeout(() => {
          targetItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
          targetItem.classList.add('open');
        }, 300);
      }
    }
  }

  /**
   * Clear search
   */
  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.performSearch('');
    }
  }

  /**
   * Open all FAQ items
   */
  expandAll() {
    this.faqItems.forEach(item => {
      item.classList.add('open');
    });
  }

  /**
   * Close all FAQ items
   */
  collapseAll() {
    this.faqItems.forEach(item => {
      item.classList.remove('open');
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only init if on FAQ page
    if (document.getElementById('faq')) {
      window.faqPage = new FaqPage();
    }
  });
} else {
  if (document.getElementById('faq')) {
    window.faqPage = new FaqPage();
  }
}

// Export for modules (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FaqPage;
}
