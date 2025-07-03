import React from 'react';
import { render, screen } from '@testing-library/react';
import PageBanner from '@components/PageBanner';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
}));

// Mock app data
jest.mock('@data/app.json', () => ({
  settings: {
    siteName: 'Test Site',
    url: 'https://test.com/',
    description: 'Test description',
  },
}), { virtual: true });

describe('PageBanner', () => {
  const defaultProps = {
    pageTitle: 'Test Page',
    pageDesc: 'Test page description',
  };

  it('renders page title and description', () => {
    render(<PageBanner {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Test Page' })).toBeInTheDocument();
    expect(screen.getByText('Test page description')).toBeInTheDocument();
  });

  it('renders breadcrumb navigation', () => {
    render(<PageBanner {...defaultProps} />);

    expect(screen.getByLabelText('Breadcrumb navigation')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    // Check for breadcrumb item specifically
    const breadcrumbItems = screen.getAllByText('Test Page');

    expect(breadcrumbItems).toHaveLength(2); // One in h1, one in breadcrumb
  });


  it('renders custom breadcrumbs when provided', () => {
    const breadcrumbs = [
      { name: 'Services', url: '/services' },
      { name: 'Roofing', url: '/services/roofing' },
      { name: 'Current Page' },
    ];

    render(<PageBanner {...defaultProps} breadcrumbs={breadcrumbs} />);

    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Roofing')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PageBanner {...defaultProps} className="custom-banner" />
    );

    expect(container.querySelector('.banner-style-one')).toHaveClass('custom-banner');
  });

  it('renders without description when not provided', () => {
    render(<PageBanner pageTitle="Test Page" />);

    expect(screen.getByRole('heading', { name: 'Test Page' })).toBeInTheDocument();
    expect(screen.queryByText('Test page description')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<PageBanner {...defaultProps} />);

    const banner = screen.getByRole('img', { name: 'Page banner background' });

    expect(banner).toBeInTheDocument();

    const breadcrumbNav = screen.getByLabelText('Breadcrumb navigation');

    expect(breadcrumbNav).toBeInTheDocument();

    const homeLink = screen.getByLabelText('Go to homepage');

    expect(homeLink).toBeInTheDocument();
  });
});