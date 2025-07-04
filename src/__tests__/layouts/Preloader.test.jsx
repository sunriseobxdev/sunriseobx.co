// Preloader Component Tests - Sunrise Construction Theme
// Tests: Component structure, CSS classes, animation elements, accessibility
// Updated: Added comprehensive tests for new sunrise-themed preloader

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Preloader from '../../layouts/Preloader';

// Mock Next.js Image component for testing
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe('Preloader Component - Sunrise Theme', () => {
  beforeEach(() => {
    render(<Preloader />);
  });

  describe('Component Structure', () => {
    test('renders main preloader container', () => {
      const preloader = document.querySelector('.preloader');

      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveClass('preloader');
    });

    test('renders sunrise container', () => {
      const sunriseContainer = document.querySelector('.sunrise-container');

      expect(sunriseContainer).toBeInTheDocument();
      expect(sunriseContainer).toHaveClass('sunrise-container');
    });

    test('renders sea horizon background', () => {
      const seaHorizon = document.querySelector('.sea-horizon');

      expect(seaHorizon).toBeInTheDocument();
      expect(seaHorizon).toHaveClass('sea-horizon');
    });

    test('renders sun container', () => {
      const sunContainer = document.querySelector('.sun-container');

      expect(sunContainer).toBeInTheDocument();
      expect(sunContainer).toHaveClass('sun-container');
    });

    test('renders sun element', () => {
      const sun = document.querySelector('.sun');

      expect(sun).toBeInTheDocument();
      expect(sun).toHaveClass('sun');
    });

    test('renders sun rays container', () => {
      const sunRays = document.querySelector('.sun-rays');

      expect(sunRays).toBeInTheDocument();
      expect(sunRays).toHaveClass('sun-rays');
    });

    test('renders sun core', () => {
      const sunCore = document.querySelector('.sun-core');

      expect(sunCore).toBeInTheDocument();
      expect(sunCore).toHaveClass('sun-core');
    });

    test('renders loading text', () => {
      const loadingText = document.querySelector('.loading-text');

      expect(loadingText).toBeInTheDocument();
      expect(loadingText).toHaveClass('loading-text');
    });
  });

  describe('Sun Rays Generation', () => {
    test('renders exactly 12 sun rays', () => {
      const rays = document.querySelectorAll('.ray');

      expect(rays).toHaveLength(12);
    });

    test('each ray has correct class structure', () => {
      const rays = document.querySelectorAll('.ray');

      rays.forEach((ray, index) => {
        expect(ray).toHaveClass('ray');
        expect(ray).toHaveClass(`ray-${index + 1}`);
      });
    });

    test('rays are numbered from 1 to 12', () => {
      for (let i = 1; i <= 12; i++) {
        const ray = document.querySelector(`.ray-${i}`);

        expect(ray).toBeInTheDocument();
      }
    });
  });

  describe('Content and Text', () => {
    test('displays company name in loading text', () => {
      const loadingText = screen.getByText('Sunrise Construction');

      expect(loadingText).toBeInTheDocument();
    });

    test('loading text is wrapped in span element', () => {
      const loadingSpan = document.querySelector('.loading-text span');

      expect(loadingSpan).toBeInTheDocument();
      expect(loadingSpan).toHaveTextContent('Sunrise Construction');
    });
  });

  describe('CSS Classes and Structure', () => {
    test('preloader has correct CSS structure for animations', () => {
      const preloader = document.querySelector('.preloader');
      const sunriseContainer = document.querySelector('.sunrise-container');
      const seaHorizon = document.querySelector('.sea-horizon');
      const sunContainer = document.querySelector('.sun-container');
      
      expect(preloader).toContainElement(sunriseContainer);
      expect(sunriseContainer).toContainElement(seaHorizon);
      expect(sunriseContainer).toContainElement(sunContainer);
    });

    test('sun structure is properly nested', () => {
      const sunContainer = document.querySelector('.sun-container');
      const sun = document.querySelector('.sun');
      const sunRays = document.querySelector('.sun-rays');
      const sunCore = document.querySelector('.sun-core');
      
      expect(sunContainer).toContainElement(sun);
      expect(sun).toContainElement(sunRays);
      expect(sun).toContainElement(sunCore);
    });

    test('all animation elements are present', () => {
      const animationElements = [
        '.sunrise-container',
        '.sea-horizon',
        '.sun-container',
        '.sun-rays',
        '.sun-core',
        '.loading-text'
      ];
      
      animationElements.forEach(selector => {
        const element = document.querySelector(selector);

        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('preloader structure is accessible', () => {
      const preloader = document.querySelector('.preloader');

      expect(preloader).toBeInTheDocument();
      
      // Check that text content is available for screen readers
      const textContent = screen.getByText('Sunrise Construction');

      expect(textContent).toBeInTheDocument();
    });

    test('no images require alt text in new design', () => {
      // New CSS-only design doesn't use images, so no alt text needed
      const images = document.querySelectorAll('img');

      expect(images).toHaveLength(0);
    });
  });

  describe('Component Props and Behavior', () => {
    test('component renders without props', () => {
      // Component should work without any props
      expect(() => render(<Preloader />)).not.toThrow();
    });

    test('component maintains consistent structure on re-render', () => {
      // Clean render for this test
      const { rerender, container } = render(<Preloader />);
      
      const initialRays = container.querySelectorAll('.ray').length;

      expect(initialRays).toBe(12);
      
      rerender(<Preloader />);
      const rerenderedRays = container.querySelectorAll('.ray').length;
      
      expect(rerenderedRays).toBe(12);
    });
  });

  describe('Theme Integration', () => {
    test('uses construction-themed elements', () => {
      // Verify sunrise theme elements are present
      expect(document.querySelector('.sea-horizon')).toBeInTheDocument();
      expect(document.querySelector('.sun-core')).toBeInTheDocument();
      expect(screen.getByText('Sunrise Construction')).toBeInTheDocument();
    });

    test('loading text reflects company branding', () => {
      const brandText = screen.getByText('Sunrise Construction');

      expect(brandText).toBeInTheDocument();
      expect(brandText.closest('.loading-text')).toBeInTheDocument();
    });
  });
});

describe('Preloader CSS Animation Classes', () => {
  test('preloader has animation-ready CSS classes', () => {
    render(<Preloader />);
    
    // Test that elements have the correct classes for CSS animations
    const animatedElements = [
      { selector: '.sunrise-container', expectedClass: 'sunrise-container' },
      { selector: '.sun-rays', expectedClass: 'sun-rays' },
      { selector: '.sun-core', expectedClass: 'sun-core' },
      { selector: '.sun-container', expectedClass: 'sun-container' },
      { selector: '.loading-text', expectedClass: 'loading-text' }
    ];
    
    animatedElements.forEach(({ selector, expectedClass }) => {
      const element = document.querySelector(selector);

      expect(element).toHaveClass(expectedClass);
    });
  });
});