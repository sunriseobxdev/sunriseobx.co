/**
 * @jest-environment jsdom
 */

// Test file for locations page layout and section spacing
// Verifies that sections don't overlap and have proper spacing

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationsPage from '../../pages/locations/index';

// Mock Next.js components
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );

  MockLink.displayName = 'MockLink';

  return MockLink;
});

jest.mock('next-seo', () => ({
  NextSeo: ({ children, ...props }) => <div data-testid="next-seo" {...props}>{children}</div>,
}));

jest.mock('../../layouts/Layouts', () => {
  const MockLayouts = ({ children }) => <div data-testid="layouts">{children}</div>;

  MockLayouts.displayName = 'MockLayouts';

  return MockLayouts;
});

jest.mock('../../components/PageBanner', () => {
  const MockPageBanner = ({ title, subtitle }) => (
    <div data-testid="page-banner">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );

  MockPageBanner.displayName = 'MockPageBanner';

  return MockPageBanner;
});

describe('Locations Page Layout', () => {
  beforeEach(() => {
    // Mock window.matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test('renders all main sections without overlap', () => {
    render(<LocationsPage />);
    
    // Check that all main sections are present
    const serviceAreasSection = screen.getByText('Outer Banks Construction Service Areas').closest('section');
    const serviceCoverageSection = screen.getByText('Complete Outer Banks Coverage').closest('section');
    const constructionExpertiseSection = screen.getByText('Coastal Construction Expertise').closest('section');
    const ctaSection = screen.getByText('Ready to Start Your OBX Construction Project?').closest('section');
    
    expect(serviceAreasSection).toBeInTheDocument();
    expect(serviceCoverageSection).toBeInTheDocument();
    expect(constructionExpertiseSection).toBeInTheDocument();
    expect(ctaSection).toBeInTheDocument();
  });

  test('sections have proper gap class for spacing', () => {
    render(<LocationsPage />);
    
    // Check that sections use the gap class instead of py-5
    const serviceAreasSection = screen.getByText('Outer Banks Construction Service Areas').closest('section');
    const serviceCoverageSection = screen.getByText('Complete Outer Banks Coverage').closest('section');
    const constructionExpertiseSection = screen.getByText('Coastal Construction Expertise').closest('section');
    const ctaSection = screen.getByText('Ready to Start Your OBX Construction Project?').closest('section');
    
    expect(serviceAreasSection).toHaveClass('gap');
    expect(serviceCoverageSection).toHaveClass('gap');
    expect(constructionExpertiseSection).toHaveClass('gap');
    expect(ctaSection).toHaveClass('gap');
    
    // Ensure py-5 is not used (which was causing overlap)
    expect(serviceAreasSection).not.toHaveClass('py-5');
    expect(serviceCoverageSection).not.toHaveClass('py-5');
    expect(constructionExpertiseSection).not.toHaveClass('py-5');
    expect(ctaSection).not.toHaveClass('py-5');
  });

  test('sections have proper semantic structure', () => {
    render(<LocationsPage />);
    
    // Check that sections are properly structured by finding section elements
    const sections = document.querySelectorAll('section');

    expect(sections.length).toBe(4); // Should have 4 main sections
    
    // Check for proper heading hierarchy (there are multiple h1s due to PageBanner and main content)
    const h1s = screen.getAllByRole('heading', { level: 1 });
    const h2s = screen.getAllByRole('heading', { level: 2 });
    const h3s = screen.getAllByRole('heading', { level: 3 });
    
    expect(h1s.length).toBeGreaterThan(0);
    expect(h2s.length).toBeGreaterThan(0);
    expect(h3s.length).toBeGreaterThan(0);
  });

  test('location cards are properly structured', () => {
    render(<LocationsPage />);
    
    // Check that location cards are present
    const locationCards = document.querySelectorAll('.location-card');

    expect(locationCards.length).toBe(6); // Should have 6 location cards
    
    // Check that each card has proper structure
    locationCards.forEach(card => {
      expect(card).toHaveClass('h-100');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('rounded');
      expect(card).toHaveClass('shadow-sm');
    });
  });

  test('responsive layout classes are applied', () => {
    render(<LocationsPage />);
    
    // Check for responsive grid classes
    const containers = document.querySelectorAll('.container');

    expect(containers.length).toBeGreaterThan(0);
    
    const rows = document.querySelectorAll('.row');

    expect(rows.length).toBeGreaterThan(0);
    
    const cols = document.querySelectorAll('[class*="col-"]');

    expect(cols.length).toBeGreaterThan(0);
  });

  test('sections have proper background classes', () => {
    render(<LocationsPage />);
    
    // Check that service coverage section has light background
    const serviceCoverageSection = screen.getByText('Complete Outer Banks Coverage').closest('section');

    expect(serviceCoverageSection).toHaveClass('bg-light');
    
    // Check that CTA section has primary background
    const ctaSection = screen.getByText('Ready to Start Your OBX Construction Project?').closest('section');

    expect(ctaSection).toHaveClass('bg-primary');
    expect(ctaSection).toHaveClass('text-white');
  });

  test('structured data is properly rendered', () => {
    render(<LocationsPage />);
    
    // Check for structured data script
    const structuredDataScript = document.querySelector('script[type="application/ld+json"]');

    expect(structuredDataScript).toBeInTheDocument();
    
    if (structuredDataScript) {
      const structuredData = JSON.parse(structuredDataScript.textContent);

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('ItemList');
      expect(structuredData.itemListElement).toHaveLength(6);
    }
  });

  test('all location links are properly formatted', () => {
    render(<LocationsPage />);
    
    // Check that all location links are present and properly formatted
    const locationLinks = screen.getAllByText(/Learn More About .+ Services/);

    expect(locationLinks).toHaveLength(6);
    
    locationLinks.forEach(link => {
      expect(link).toHaveClass('btn');
      expect(link).toHaveClass('btn-primary');
    });
  });

  test('contact information is accessible', () => {
    render(<LocationsPage />);
    
    // Check for contact links
    const phoneLink = screen.getByText('Call (252) 207-2602');
    const quoteLink = screen.getByText('Get Free Quote');
    
    expect(phoneLink).toBeInTheDocument();
    expect(quoteLink).toBeInTheDocument();
    
    expect(phoneLink).toHaveAttribute('href', 'tel:(252)207-2602');
    expect(quoteLink).toHaveAttribute('href', '/contact');
  });
});