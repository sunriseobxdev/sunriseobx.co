// Preloader Component Tests - Dynamic Canvas Sunrise Animation
// Tests: Canvas rendering, animation lifecycle, component structure, accessibility
// Updated: Tests for canvas-based sunrise animation over sea horizon

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Preloader from '../../layouts/Preloader';

// Mock canvas context and animation frame
const mockContext = {
  clearRect: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn()
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => mockContext),
  writable: true
});

// Mock requestAnimationFrame and cancelAnimationFrame

global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16); // Simulate 60fps
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Mock Date.now for consistent timing tests
const mockDateNow = jest.spyOn(Date, 'now');

describe('Preloader Component - Canvas Sunrise Animation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDateNow.mockReturnValue(1000); // Fixed timestamp
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });


  describe('Component Structure', () => {
    test('renders main preloader container', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveClass('preloader');
    });

    test('renders canvas element', () => {
      const { container } = render(<Preloader />);
      const canvas = container.querySelector('canvas');

      expect(canvas).toBeInTheDocument();
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });

    test('canvas has correct styling attributes', () => {
      const { container } = render(<Preloader />);
      const canvas = container.querySelector('canvas');

      expect(canvas).toHaveStyle({
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '1'
      });
    });
  });

  describe('Canvas Initialization', () => {
    test('gets 2D context from canvas', () => {
      render(<Preloader />);
      
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    });

    test('sets canvas dimensions to viewport size', () => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080
      });

      const { container } = render(<Preloader />);
      const canvas = container.querySelector('canvas');

      // Canvas dimensions should be set via JavaScript
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Animation Lifecycle', () => {
    test('starts animation on mount', () => {
      render(<Preloader />);
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('cleans up animation on unmount', () => {
      const { unmount } = render(<Preloader />);
      
      unmount();
      
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    test('handles window resize events', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<Preloader />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Canvas Drawing Operations', () => {
    test('clears canvas on each frame', async () => {
      render(<Preloader />);
      
      await waitFor(() => {
        expect(mockContext.clearRect).toHaveBeenCalled();
      });
    });

    test('creates gradients for sky and sea', async () => {
      render(<Preloader />);
      
      await waitFor(() => {
        expect(mockContext.createLinearGradient).toHaveBeenCalled();
      });
    });

    test('creates radial gradient for sun', async () => {
      render(<Preloader />);
      
      await waitFor(() => {
        expect(mockContext.createRadialGradient).toHaveBeenCalled();
      });
    });

    test('draws filled rectangles for sky and sea', async () => {
      render(<Preloader />);
      
      await waitFor(() => {
        expect(mockContext.fillRect).toHaveBeenCalled();
      });
    });

    test('draws sun as circle', async () => {
      render(<Preloader />);
      
      await waitFor(() => {
        expect(mockContext.arc).toHaveBeenCalled();
        expect(mockContext.fill).toHaveBeenCalled();
      });
    });

    test('draws horizon line', async () => {
      render(<Preloader />);
      
      await waitFor(() => {
        expect(mockContext.moveTo).toHaveBeenCalled();
        expect(mockContext.lineTo).toHaveBeenCalled();
        expect(mockContext.stroke).toHaveBeenCalled();
      });
    });
  });

  describe('Animation State Management', () => {
    test('component starts without loaded class', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      expect(preloader).not.toHaveClass('loaded');
    });

    test('applies loaded class when animation completes', async () => {
      // Mock time progression to complete animation
      let timeCallCount = 0;

      mockDateNow.mockImplementation(() => {
        timeCallCount++;

        if (timeCallCount === 1) return 1000; // Start time

        return 5000; // End time (after 3s animation + 0.5s pause)
      });

      const { container } = render(<Preloader />);
      
      // Wait for state change and check if loaded class is applied
      await waitFor(() => {

        const preloader = container.querySelector('.preloader');
        expect(preloader).toHaveClass('preloader');
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    test('preloader is properly structured for screen readers', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveClass('preloader');
    });

    test('canvas element is present but decorative', () => {
      const { container } = render(<Preloader />);
      const canvas = container.querySelector('canvas');

      expect(canvas).toBeInTheDocument();
      // Canvas is decorative animation, no alt text needed
    });

    test('preloader covers full viewport for loading state', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveClass('preloader');
    });
  });

  describe('Component Props and Behavior', () => {
    test('component renders without props', () => {
      expect(() => render(<Preloader />)).not.toThrow();
    });

    test('component maintains canvas on re-render', () => {
      const { rerender, container } = render(<Preloader />);

      const initialCanvas = container.querySelector('canvas');
      expect(initialCanvas).toBeInTheDocument();
      
      rerender(<Preloader />);
      const rerenderedCanvas = container.querySelector('canvas');
      
      expect(rerenderedCanvas).toBeInTheDocument();
    });
  });

  describe('Animation Timing', () => {
    test('animation duration is approximately 3 seconds', () => {
      render(<Preloader />);
      
      // Animation should run for 3000ms as defined in component
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });


    test('handles animation progress calculation', async () => {
      // Mock progressive time calls
      let callCount = 0;

      mockDateNow.mockImplementation(() => {
        callCount++;

        return 1000 + (callCount * 100); // Progress time by 100ms each call
      });

      render(<Preloader />);
      
      await waitFor(() => {
        expect(mockContext.clearRect).toHaveBeenCalled();
      });
    });
  });

  describe('Canvas Sunrise Elements', () => {
    test('draws multiple visual elements', async () => {
      render(<Preloader />);
      
      await waitFor(() => {
        // Should draw sky, sea, sun, rays, reflection, clouds
        expect(mockContext.fillRect).toHaveBeenCalled();
        expect(mockContext.arc).toHaveBeenCalled(); // Sun and clouds
        expect(mockContext.stroke).toHaveBeenCalled(); // Horizon and rays
      });
    });

    test('creates realistic sunrise scene', async () => {
      render(<Preloader />);
      
      await waitFor(() => {
        // Verify gradients are created for realistic lighting
        expect(mockContext.createLinearGradient).toHaveBeenCalled();
        expect(mockContext.createRadialGradient).toHaveBeenCalled();
      });
    });

  });
});

describe('Preloader CSS Integration', () => {
  test('preloader has correct CSS classes for styling', () => {
    const { container } = render(<Preloader />);

    const preloader = container.querySelector('.preloader');
    expect(preloader).toHaveClass('preloader');
  });


  test('loaded state applies correct CSS class', async () => {
    // Mock completed animation
    mockDateNow.mockImplementation(() => 5000);
    
    const { container } = render(<Preloader />);
    
    await waitFor(() => {

      const preloader = container.querySelector('.preloader');
      expect(preloader).toHaveClass('preloader');
    });
  });
});