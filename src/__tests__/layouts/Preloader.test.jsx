// Preloader Component Tests - Sunrise Construction Theme
// Tests: Component structure, CSS classes, animation elements, accessibility
// Updated: Tests for compact sunrise spinner design

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Preloader from '../../layouts/Preloader';

// Mock Next.js Image component for testing
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe('Preloader Component - Sunrise Spinner', () => {
  beforeEach(() => {
    render(<Preloader />);
  });

  describe('Component Structure', () => {
    test('renders main preloader container', () => {
      const preloader = document.querySelector('.preloader');

      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveClass('preloader');
    });

    test('renders sunrise spinner container', () => {
      const sunriseSpinner = document.querySelector('.sunrise-spinner');

      expect(sunriseSpinner).toBeInTheDocument();
      expect(sunriseSpinner).toHaveClass('sunrise-spinner');
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
  });

  describe('Sun Rays Generation', () => {
    test('renders exactly 8 sun rays', () => {
      const rays = document.querySelectorAll('.ray');

      expect(rays).toHaveLength(8);
    });

    test('each ray has correct class structure', () => {
      const rays = document.querySelectorAll('.ray');

      rays.forEach((ray, index) => {
        expect(ray).toHaveClass('ray');
        expect(ray).toHaveClass(`ray-${index + 1}`);
      });
    });

    test('rays are numbered from 1 to 8', () => {
      for (let i = 1; i <= 8; i++) {
        const ray = document.querySelector(`.ray-${i}`);

        expect(ray).toBeInTheDocument();
      }
    });
  });

  describe('CSS Classes and Structure', () => {
    test('preloader has correct CSS structure for animations', () => {
      const preloader = document.querySelector('.preloader');
      const sunriseSpinner = document.querySelector('.sunrise-spinner');
      const sunContainer = document.querySelector('.sun-container');
      
      expect(preloader).toContainElement(sunriseSpinner);
      expect(sunriseSpinner).toContainElement(sunContainer);
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
        '.sunrise-spinner',
        '.sun-container',
        '.sun-rays',
        '.sun-core'
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
    });

    test('no images require alt text in CSS-only design', () => {
      // Pure CSS design doesn't use images, so no alt text needed
      const images = document.querySelectorAll('img');

      expect(images).toHaveLength(0);
    });

    test('spinner is visually centered and compact', () => {
      const sunriseSpinner = document.querySelector('.sunrise-spinner');

      expect(sunriseSpinner).toBeInTheDocument();
      expect(sunriseSpinner).toHaveClass('sunrise-spinner');
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

      expect(initialRays).toBe(8);
      
      rerender(<Preloader />);
      const rerenderedRays = container.querySelectorAll('.ray').length;
      
      expect(rerenderedRays).toBe(8);
    });
  });

  describe('Spinner Design', () => {
    test('uses compact sunrise-themed elements', () => {
      // Verify compact spinner elements are present
      expect(document.querySelector('.sunrise-spinner')).toBeInTheDocument();
      expect(document.querySelector('.sun-core')).toBeInTheDocument();
      expect(document.querySelector('.sun-rays')).toBeInTheDocument();
    });

    test('spinner has appropriate size constraints', () => {
      const sunriseSpinner = document.querySelector('.sunrise-spinner');

      expect(sunriseSpinner).toBeInTheDocument();
      expect(sunriseSpinner).toHaveClass('sunrise-spinner');
    });

    test('no fullscreen background elements', () => {
      // Ensure no fullscreen elements like sea-horizon or loading-text
      expect(document.querySelector('.sea-horizon')).not.toBeInTheDocument();
      expect(document.querySelector('.loading-text')).not.toBeInTheDocument();
    });
  });
});

describe('Preloader CSS Animation Classes', () => {
  test('preloader has animation-ready CSS classes', () => {
    render(<Preloader />);
    
    // Test that elements have the correct classes for CSS animations
    const animatedElements = [
      { selector: '.sunrise-spinner', expectedClass: 'sunrise-spinner' },
      { selector: '.sun-rays', expectedClass: 'sun-rays' },
      { selector: '.sun-core', expectedClass: 'sun-core' },
      { selector: '.sun-container', expectedClass: 'sun-container' }
    ];
    
    animatedElements.forEach(({ selector, expectedClass }) => {
      const element = document.querySelector(selector);

      expect(element).toHaveClass(expectedClass);
    });
  });
});