/**
 * Utility functions for DOM manipulation and UI interactions
 * Improved with error handling, modern JavaScript patterns, and better performance
 */

/**
 * Safely query DOM elements with error handling
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {Element|null} - Found element or null
 */
export const safeQuerySelector = (selector, context = document) => {
  try {
    return context.querySelector(selector);
  } catch (error) {
    // Invalid selector handled

    return null;
  }
};

/**
 * Safely query multiple DOM elements with error handling
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {NodeList} - Found elements or empty NodeList
 */
export const safeQuerySelectorAll = (selector, context = document) => {
  try {
    return context.querySelectorAll(selector);
  } catch (error) {
    // Invalid selector handled

    return [];
  }
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
};

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * What we build projects list hover functionality
 * Improved with error handling and modern patterns
 */
export const projectsListHover = () => {
  const allProjectsItems = safeQuerySelectorAll('.wwb-ul li');
  
  if (!allProjectsItems.length) {
    // No project items found for hover functionality

    return;
  }

  const handleMouseOver = (currentItem) => {
    // Remove active class from all items
    allProjectsItems.forEach((item) => {
      item.classList.remove('active');
    });
    
    // Add active class to current item
    currentItem.classList.add('active');
  };

  allProjectsItems.forEach((item) => {
    item.addEventListener('mouseover', () => handleMouseOver(item), { passive: true });
  });
};

/**
 * Estimated form steps functionality
 * Improved with error handling and accessibility
 */
export const estimatedFormSteps = () => {
  const elements = {
    buttonContinue: safeQuerySelector('#estFormContinue'),
    buttonBack: safeQuerySelector('#estFormBack'),
    buttonSubmit: safeQuerySelector('#estFormSubmit'),
    formStep1: safeQuerySelector('.est-form-step-1'),
    formStep2: safeQuerySelector('.est-form-step-2'),
  };

  // Check if all required elements exist
  const missingElements = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([key]) => key);

  if (missingElements.length > 0) {
    // Missing form elements handled

    return;
  }

  const showStep = (stepToShow, stepToHide, buttonsToShow, buttonsToHide) => {
    // Hide current step
    stepToHide.style.display = 'none';
    stepToHide.setAttribute('aria-hidden', 'true');
    
    // Show next step
    stepToShow.style.display = 'block';
    stepToShow.setAttribute('aria-hidden', 'false');
    
    // Update button visibility
    buttonsToHide.forEach(button => {
      button.style.display = 'none';
      button.setAttribute('aria-hidden', 'true');
    });
    
    buttonsToShow.forEach(button => {
      button.style.display = 'block';
      button.setAttribute('aria-hidden', 'false');
    });
  };

  elements.buttonContinue.addEventListener('click', (e) => {
    e.preventDefault();
    showStep(
      elements.formStep2,
      elements.formStep1,
      [elements.buttonBack, elements.buttonSubmit],
      [elements.buttonContinue]
    );
  });

  elements.buttonBack.addEventListener('click', (e) => {
    e.preventDefault();
    showStep(
      elements.formStep1,
      elements.formStep2,
      [elements.buttonContinue],
      [elements.buttonBack, elements.buttonSubmit]
    );
  });
};

/**
 * Contact us navigation functionality
 * Improved with error handling and better performance
 */
export const contactUsNavigation = () => {
  const contactItems = safeQuerySelectorAll('.contact-us .c-data ul li');
  const contactCards = safeQuerySelectorAll('.c-cards .card');

  if (!contactItems.length || !contactCards.length) {
    // Contact navigation elements not found

    return;
  }

  const activateCard = (index) => {
    // Remove active class from all cards
    contactCards.forEach((card) => {
      card.classList.remove('active');
    });
    
    // Activate the selected card if it exists
    if (contactCards[index]) {
      contactCards[index].classList.add('active');
    }
  };

  contactItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active class from all contact items
      contactItems.forEach((element) => {
        const link = element.querySelector('a');

        if (link) {
          link.classList.remove('active');
        }
      });

      // Add active class to clicked item
      const currentLink = item.querySelector('a');

      if (currentLink) {
        currentLink.classList.add('active');
      }

      // Activate corresponding card
      activateCard(index);
    });
  });
};

/**
 * Smooth scroll to element
 * @param {string|Element} target - Target element or selector
 * @param {number} offset - Offset from top (default: 0)
 * @param {string} behavior - Scroll behavior (default: 'smooth')
 */
export const smoothScrollTo = (target, offset = 0, behavior = 'smooth') => {
  const element = typeof target === 'string' ? safeQuerySelector(target) : target;
  
  if (!element) {
    // Scroll target not found

    return;
  }

  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior,
  });
};

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @param {number} threshold - Threshold percentage (0-1)
 * @returns {boolean} - Whether element is in viewport
 */
export const isInViewport = (element, threshold = 0) => {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const vertInView = (rect.top <= windowHeight * (1 - threshold)) &&
                     ((rect.top + rect.height) >= windowHeight * threshold);
  const horInView = (rect.left <= windowWidth * (1 - threshold)) &&
                    ((rect.left + rect.width) >= windowWidth * threshold);

  return vertInView && horInView;
};

/**
 * Format phone number for display
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phoneNumber;
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

/**
 * Get URL parameters
 * @param {string} param - Parameter name
 * @returns {string|null} - Parameter value or null
 */
export const getUrlParameter = (param) => {
  const urlParams = new URLSearchParams(window.location.search);

  return urlParams.get(param);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch (error) {
    // Clipboard API not available, using fallback
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');

    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);

      return true;
    } catch (fallbackError) {
      document.body.removeChild(textArea);
      // Failed to copy text

      return false;
    }
  }
};