import { useEffect, useCallback } from 'react';
import { scrollAnimation } from '@common/scrollAnims';
import { smoothScrollTo } from '@common/utilits';
import ErrorBoundary from '@components/ErrorBoundary';

import Footer from './footers/Index';
import Header from './headers/Index';
import Preloader from './Preloader';

const Layouts = ({
  children,
  header,
  footer,
  noHeader,
  noFooter,
  contactButton,
  cartButton,
  className = '',
}) => {
  // Handle preloader with simple fade
  const handlePreloader = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const loader = document.querySelector('.preloader');

      if (loader) {
        // Simple fade out after a short delay
        setTimeout(() => {
          loader.classList.add('loaded');
        }, 800); // Match the fade duration
      }
    } catch (error) {
      // Preloader initialization failed
    }
  }, []);

  // Handle scroll to top functionality
  const handleScrollToTop = useCallback(() => {
    smoothScrollTo(document.body, 0);
  }, []);

  // Initialize scroll animations and preloader
  useEffect(() => {
    try {
      scrollAnimation();
      handlePreloader();
    } catch (error) {
      // Layout initialization failed
    }
  }, [handlePreloader]);

  // Handle scroll to top button visibility
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollButton = document.getElementById('scrollTop');

    if (!scrollButton) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > 300) {
        scrollButton.classList.add('active');
      } else {
        scrollButton.classList.remove('active');
      }
    };

    // Throttled scroll handler for better performance
    let ticking = false;
    const throttledScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className={`layout-wrapper ${className}`}>
        <Preloader />

        {!noHeader && (
          <Header
            header={header}
            contactButton={contactButton}
            cartButton={cartButton}
          />
        )}

        <main className="main-content" role="main">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>

        {!noFooter && (
          <Footer footer={footer} />
        )}

        <button
          id="scrollTop"
          className="scrollTopStick"
          onClick={handleScrollToTop}
          aria-label="Scroll to top"
          type="button"
        >
          <i className="fa-solid fa-arrow-up" />
        </button>
      </div>
    </ErrorBoundary>
  );
};

export default Layouts;
