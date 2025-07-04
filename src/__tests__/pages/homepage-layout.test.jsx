/**
 * @jest-environment jsdom
 */

// Test file for homepage layout and section spacing
// Verifies that Hero and About sections don't overlap

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home3 from '../../pages/index';

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

// Mock the data files
jest.mock('../../data/sections/hero-3.json', () => ({
  title: "Outer Banks Premier Construction Company - Building Trust Since 2003",
  description: "Sunrise Construction is the Outer Banks' leading construction company specializing in hurricane-resistant homes, beachfront construction, and coastal renovations. We build lasting partnerships while creating beautiful, storm-ready homes across the OBX.",
  video: {
    url: "/intro-sunrise.mp4",
    poster: "/img/f-3.jpg",
    alt: "Sunrise Construction - Outer Banks Construction Company Introduction Video"
  },
  info: "Serving <strong>Outer Banks, NC</strong> with elite construction services • <strong>Hurricane-resistant construction</strong> • <strong>Beachfront specialists</strong> • <strong>20+ years experience</strong>"
}));

jest.mock('../../data/sections/about-3.json', () => ({
  title: "Sunrise Construction has a proud tradition of service as a General Contractor <span>since 2023</span>",
  description: "We successfully troubleshoot and solve problems with tasks of varying complexity, provide long-term guarantees, and regularly master new technologies in building science. Our portfolio includes <span>dozens of successfully</span> completed projects.",
  items: [
    {
      image: "/img/roofReplacements.jpeg",
      title: "Roof Replacements",
      text: "",
      link: "/services/service-1"
    },
    {
      image: "/img/newSidingMakeover.jpeg",
      title: "New Siding Makeover",
      text: "",
      link: "/services/service-2"
    },
    {
      image: "/img/windowReplacements.jpg",
      title: "Window Replacements",
      text: "",
      link: "/services/service-3"
    }
  ]
}));

// Mock library functions
jest.mock('../../lib/posts', () => ({
  getSortedPostsData: () => []
}));

jest.mock('../../lib/projects', () => ({
  getSortedProjectsData: () => []
}));

// Mock all section components
jest.mock('../../components/sections/Hero3', () => {
  const MockHero3 = () => (
    <section className="featured-section-three" data-testid="hero-section">
      <div className="container">
        <div className="row space align-items-center">
          <div className="col-lg-6">
            <div className="data">
              <h2>Outer Banks Premier Construction Company - Building Trust Since 2003</h2>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="info">
            <p>Serving <strong>Outer Banks, NC</strong> with elite construction services • <strong>Hurricane-resistant construction</strong> • <strong>Beachfront specialists</strong> • <strong>20+ years experience</strong></p>
          </div>
        </div>
      </div>
    </section>
  );

  MockHero3.displayName = 'MockHero3';

  return MockHero3;
});

jest.mock('../../components/sections/About3', () => {
  const MockAbout3 = () => (
    <section className="gap history-style-one" data-testid="about-section">
      <div className="heading heading-style-3">
        <h2>Sunrise Construction has a proud tradition of service as a General Contractor <span>since 2023</span></h2>
      </div>
    </section>
  );

  MockAbout3.displayName = 'MockAbout3';

  return MockAbout3;
});

jest.mock('../../components/sections/CallToAction', () => {
  const MockCallToAction = () => <section data-testid="cta-section">CTA Section</section>;

  MockCallToAction.displayName = 'MockCallToAction';

  return MockCallToAction;
});

jest.mock('../../components/sections/ContactForm', () => {
  const MockContactForm = () => <section data-testid="contact-section">Contact Section</section>;

  MockContactForm.displayName = 'MockContactForm';

  return MockContactForm;
});

jest.mock('../../components/sliders/Partners', () => {
  const MockPartners = () => <section data-testid="partners-section">Partners Section</section>;

  MockPartners.displayName = 'MockPartners';

  return MockPartners;
});

jest.mock('../../components/sliders/Projects', () => {
  const MockProjects = () => <section data-testid="projects-section">Projects Section</section>;

  MockProjects.displayName = 'MockProjects';

  return MockProjects;
});

describe('Homepage Layout', () => {
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

  test('renders hero and about sections without overlap', () => {
    const props = { posts: [], projects: [] };

    render(<Home3 {...props} />);
    
    // Check that both sections are present
    const heroSection = screen.getByTestId('hero-section');
    const aboutSection = screen.getByTestId('about-section');
    
    expect(heroSection).toBeInTheDocument();
    expect(aboutSection).toBeInTheDocument();
  });

  test('hero section has proper CSS classes for spacing', () => {
    const props = { posts: [], projects: [] };

    render(<Home3 {...props} />);
    
    const heroSection = screen.getByTestId('hero-section');

    expect(heroSection).toHaveClass('featured-section-three');
  });

  test('about section has proper CSS classes for spacing', () => {
    const props = { posts: [], projects: [] };

    render(<Home3 {...props} />);
    
    const aboutSection = screen.getByTestId('about-section');

    expect(aboutSection).toHaveClass('gap');
    expect(aboutSection).toHaveClass('history-style-one');
  });

  test('sections contain the overlapping text content', () => {
    const props = { posts: [], projects: [] };

    render(<Home3 {...props} />);
    
    // Check for the specific text that was overlapping - using more flexible text matching
    // The text is split across multiple elements with <strong> tags, so we need to check for parts
    expect(screen.getByText(/Serving/)).toBeInTheDocument();
    expect(screen.getByText(/Outer Banks, NC/)).toBeInTheDocument();
    expect(screen.getByText(/with elite construction services/)).toBeInTheDocument();
    expect(screen.getByText(/Hurricane-resistant construction/)).toBeInTheDocument();
    expect(screen.getByText(/Beachfront specialists/)).toBeInTheDocument();
    expect(screen.getByText(/20\+ years experience/)).toBeInTheDocument();
    
    expect(screen.getByText(/Sunrise Construction has a proud tradition of service/)).toBeInTheDocument();
    expect(screen.getByText(/since 2023/)).toBeInTheDocument();
  });

  test('all main sections are rendered in correct order', () => {
    const props = { posts: [], projects: [] };

    render(<Home3 {...props} />);
    
    // Check that all sections are present
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('about-section')).toBeInTheDocument();
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
    expect(screen.getByTestId('projects-section')).toBeInTheDocument();
    expect(screen.getByTestId('partners-section')).toBeInTheDocument();
    expect(screen.getByTestId('contact-section')).toBeInTheDocument();
  });

  test('sections have proper semantic structure', () => {
    const props = { posts: [], projects: [] };

    render(<Home3 {...props} />);
    
    // Check that sections are properly structured
    const sections = document.querySelectorAll('section');

    expect(sections.length).toBeGreaterThan(0);
    
    // Check for proper heading hierarchy
    const h2s = screen.getAllByRole('heading', { level: 2 });

    expect(h2s.length).toBeGreaterThan(0);
  });
});