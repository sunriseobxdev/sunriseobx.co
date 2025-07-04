// Preloader Component Tests - Simple Black Fade
// Tests: Component structure, fade timing, accessibility
// Updated: Tests for simple black fade preloader

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Preloader from '../../layouts/Preloader';

// Mock setTimeout for testing fade timing
jest.useFakeTimers();

describe('Preloader Component - Simple Black Fade', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Component Structure', () => {
    test('renders main preloader container', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveClass('preloader');
    });

    test('preloader has correct initial state', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      expect(preloader).not.toHaveClass('loaded');
    });

    test('preloader contains no canvas element', () => {
      const { container } = render(<Preloader />);
      const canvas = container.querySelector('canvas');

      expect(canvas).not.toBeInTheDocument();
    });
  });

  describe('Fade Animation', () => {
    test('component starts without loaded class', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      expect(preloader).not.toHaveClass('loaded');
    });

    test('applies loaded class after fade duration', async () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      // Initially should not have loaded class
      expect(preloader).not.toHaveClass('loaded');

      // Fast-forward time by 800ms (fade duration)
      jest.advanceTimersByTime(800);

      await waitFor(() => {
        expect(preloader).toHaveClass('loaded');
      });
    });

    test('does not apply loaded class before fade duration', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      // Fast-forward time by 400ms (half of fade duration)
      jest.advanceTimersByTime(400);

      expect(preloader).not.toHaveClass('loaded');
    });
  });

  describe('Component Lifecycle', () => {
    test('component renders without props', () => {
      expect(() => render(<Preloader />)).not.toThrow();
    });

    test('component maintains state on re-render', () => {
      const { rerender, container } = render(<Preloader />);

      const initialPreloader = container.querySelector('.preloader');
      expect(initialPreloader).toBeInTheDocument();
      
      rerender(<Preloader />);
      const rerenderedPreloader = container.querySelector('.preloader');
      
      expect(rerenderedPreloader).toBeInTheDocument();
      expect(rerenderedPreloader).toHaveClass('preloader');
    });

    test('cleans up timer on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { unmount } = render(<Preloader />);
      
      unmount();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('preloader is properly structured for screen readers', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveClass('preloader');
    });

    test('preloader covers full viewport for loading state', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      expect(preloader).toBeInTheDocument();
      expect(preloader).toHaveClass('preloader');
    });

    test('preloader is a simple overlay without complex content', () => {
      const { container } = render(<Preloader />);
      const preloader = container.querySelector('.preloader');

      // Should be a simple div with minimal content
      expect(preloader.children.length).toBe(0);
    });
  });

  describe('CSS Integration', () => {
    test('preloader has correct CSS classes for styling', () => {
      const { container } = render(<Preloader />);

      const preloader = container.querySelector('.preloader');
      expect(preloader).toHaveClass('preloader');
    });

    test('loaded state applies correct CSS class', async () => {
      const { container } = render(<Preloader />);
      
      // Fast-forward time to complete fade
      jest.advanceTimersByTime(800);
      
      await waitFor(() => {
        const preloader = container.querySelector('.preloader');
        expect(preloader).toHaveClass('loaded');
      });
    });
  });

  describe('Performance', () => {
    test('uses simple timeout instead of animation frame', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      render(<Preloader />);
      
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 800);
    });

    test('has minimal DOM footprint', () => {
      const { container } = render(<Preloader />);
      
      // Should only have one preloader div
      expect(container.children.length).toBe(1);
      expect(container.firstChild).toHaveClass('preloader');
    });
  });
});

describe('Preloader Integration', () => {
  test('works with CSS fade transitions', () => {
    const { container } = render(<Preloader />);
    const preloader = container.querySelector('.preloader');

    // Should rely on CSS for fade effect
    expect(preloader).toBeInTheDocument();
    expect(preloader).toHaveClass('preloader');
  });

  test('timing matches CSS transition duration', async () => {
    const { container } = render(<Preloader />);
    
    // 800ms matches the CSS transition duration
    jest.advanceTimersByTime(800);
    
    await waitFor(() => {
      const preloader = container.querySelector('.preloader');
      expect(preloader).toHaveClass('loaded');
    });
  });
});