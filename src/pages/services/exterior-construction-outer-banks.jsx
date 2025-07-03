// SEO-optimized Exterior Construction service page for Outer Banks
// Target keywords: "exterior construction Outer Banks", "coastal construction OBX", "beachfront construction NC"
// Geographic targeting: Outer Banks, NC - coastal and beachfront construction

import React from 'react';
import { NextSeo } from 'next-seo';
import Layouts from '@layouts/Layouts';
import PageBanner from '@components/PageBanner';
import Link from 'next/link';

const ExteriorConstructionPage = () => {
  const seoData = {
    title: 'Exterior Construction Outer Banks | Coastal Construction Contractors OBX',
    description: 'Professional exterior construction services in Outer Banks, NC. Coastal construction, beachfront building, underpinning, porches, and structural improvements for OBX homes.',
    canonical: 'https://sunriseobx.co/services/exterior-construction-outer-banks',
    keywords: 'exterior construction Outer Banks, coastal construction OBX, beachfront construction NC, underpinning OBX, coastal porches, Nags Head construction, Duck construction, Kitty Hawk contractors',
    openGraph: {
      title: 'Exterior Construction Outer Banks | Coastal Construction Contractors OBX',
      description: 'Professional exterior construction services in Outer Banks, NC. Coastal construction, beachfront building, underpinning, porches, and structural improvements for OBX homes.',
      url: 'https://sunriseobx.co/services/exterior-construction-outer-banks',
      type: 'website',
      images: [
        {
          url: 'https://sunriseobx.co/images/exterior-construction-outer-banks.jpg',
          width: 1200,
          height: 630,
          alt: 'Exterior Construction Services Outer Banks NC',
        },
      ],
    },
    additionalMetaTags: [
      {
        name: 'geo.region',
        content: 'US-NC',
      },
      {
        name: 'geo.placename',
        content: 'Outer Banks, North Carolina',
      },
      {
        name: 'geo.position',
        content: '36.1063;-75.7135',
      },
      {
        name: 'ICBM',
        content: '36.1063, -75.7135',
      },
    ],
  };

  const serviceStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Exterior Construction Services Outer Banks',
    description: 'Complete exterior construction services for coastal and beachfront homes in Outer Banks, NC',
    provider: {
      '@type': 'GeneralContractor',
      name: 'Sunrise Construction OBX',
      url: 'https://sunriseobx.co',
      telephone: '(252) 207-2602',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '5200 N Croatan Hwy',
        addressLocality: 'Kitty Hawk',
        addressRegion: 'NC',
        postalCode: '27949',
        addressCountry: 'US',
      },
    },
    areaServed: [
      'Nags Head, NC',
      'Duck, NC',
      'Kitty Hawk, NC',
      'Kill Devil Hills, NC',
      'Manteo, NC',
      'Hatteras, NC',
      'Outer Banks, NC',
    ],
    serviceType: 'Exterior Construction',
    category: 'Coastal Construction',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      businessFunction: 'https://schema.org/Sell',
    },
  };

  return (
    <>
      <NextSeo {...seoData} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceStructuredData),
        }}
      />
      
      <Layouts>
        <PageBanner
          title="Exterior Construction Services"
          subtitle="Complete Coastal Construction Solutions for Outer Banks"
          breadcrumb={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: 'Exterior Construction', href: '/services/exterior-construction-outer-banks' },
          ]}
        />
        
        <section className="service-details py-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8">
                <div className="service-content">
                  <h1>Professional Exterior Construction Services in Outer Banks, NC</h1>
                  
                  <p className="lead">
                    Transform and protect your Outer Banks property with comprehensive exterior construction 
                    services designed for coastal environments. From beachfront additions to hurricane-resistant 
                    improvements, we specialize in construction that withstands the unique challenges of OBX living.
                  </p>
                  
                  <h2>Our Exterior Construction Services</h2>
                  
                  <h3>Coastal Underpinning & Foundation Work</h3>
                  <p>
                    Strengthen your OBX home's foundation with professional underpinning services designed 
                    for coastal conditions. Our underpinning solutions protect against erosion, flooding, 
                    and shifting sands while meeting all local building codes.
                  </p>
                  <ul>
                    <li>Concrete pier underpinning</li>
                    <li>Steel beam reinforcement</li>
                    <li>Flood-resistant foundation systems</li>
                    <li>Crawl space encapsulation</li>
                    <li>Foundation waterproofing</li>
                  </ul>
                  
                  <h3>Hurricane-Resistant Porches & Decks</h3>
                  <p>
                    Enjoy outdoor living with confidence using our hurricane-resistant porch and deck 
                    construction. Built to withstand coastal winds and weather while providing beautiful 
                    outdoor spaces for your OBX home.
                  </p>
                  <ul>
                    <li>Elevated deck construction</li>
                    <li>Screened porch additions</li>
                    <li>Composite decking installation</li>
                    <li>Hurricane-rated railings</li>
                    <li>Coastal-grade fasteners and hardware</li>
                  </ul>
                  
                  <h3>Beachfront Structural Improvements</h3>
                  <p>
                    Enhance your beachfront property with structural improvements designed for oceanfront 
                    exposure. Our construction methods account for salt air, high winds, and coastal erosion.
                  </p>
                  <ul>
                    <li>Exterior wall reinforcement</li>
                    <li>Hurricane shutters and protection</li>
                    <li>Coastal siding installation</li>
                    <li>Saltwater-resistant materials</li>
                    <li>Structural additions and modifications</li>
                  </ul>
                  
                  <h3>Coastal Insulation & Weatherization</h3>
                  <p>
                    Improve your home's energy efficiency and comfort with coastal-specific insulation 
                    and weatherization services. Protect against humidity, salt air, and temperature 
                    fluctuations common in the Outer Banks.
                  </p>
                  <ul>
                    <li>Spray foam insulation</li>
                    <li>Vapor barrier installation</li>
                    <li>Air sealing services</li>
                    <li>Moisture control systems</li>
                    <li>Energy-efficient upgrades</li>
                  </ul>
                  
                  <h2>Why Choose Our Exterior Construction Services?</h2>
                  <ul>
                    <li><strong>Coastal Expertise:</strong> 20+ years of OBX construction experience</li>
                    <li><strong>Hurricane Resistance:</strong> All work meets or exceeds coastal building codes</li>
                    <li><strong>Quality Materials:</strong> Marine-grade and corrosion-resistant materials</li>
                    <li><strong>Licensed & Insured:</strong> Fully licensed North Carolina contractors</li>
                    <li><strong>Local Knowledge:</strong> Understanding of OBX environmental challenges</li>
                    <li><strong>Warranty Protection:</strong> Comprehensive warranties on all work</li>
                  </ul>
                  
                  <h2>Our Construction Process</h2>
                  <ol>
                    <li><strong>Site Evaluation:</strong> Comprehensive assessment of coastal conditions</li>
                    <li><strong>Design & Planning:</strong> Custom solutions for your specific needs</li>
                    <li><strong>Permit Acquisition:</strong> Handling all necessary permits and approvals</li>
                    <li><strong>Material Selection:</strong> Coastal-grade materials and hardware</li>
                    <li><strong>Professional Construction:</strong> Expert installation by certified crews</li>
                    <li><strong>Quality Inspection:</strong> Thorough inspection and testing</li>
                    <li><strong>Final Walkthrough:</strong> Complete project review and warranty documentation</li>
                  </ol>
                  
                  <h2>Service Areas Throughout Outer Banks</h2>
                  <p>
                    We provide professional exterior construction services throughout the OBX region:
                  </p>
                  <div className="row">
                    <div className="col-md-6">
                      <ul>
                        <li>Nags Head exterior construction</li>
                        <li>Duck beachfront construction</li>
                        <li>Kitty Hawk coastal contractors</li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <ul>
                        <li>Kill Devil Hills construction services</li>
                        <li>Manteo exterior improvements</li>
                        <li>Hatteras coastal construction</li>
                      </ul>
                    </div>
                  </div>
                  
                  <h2>Building Code Compliance</h2>
                  <p>
                    All our exterior construction work complies with North Carolina coastal building codes, 
                    including wind load requirements, flood zone regulations, and environmental protection 
                    standards. We ensure your project meets all local and state requirements.
                  </p>
                  
                  <div className="cta-section mt-5 p-4 bg-light rounded">
                    <h3>Ready to Improve Your OBX Property?</h3>
                    <p>
                      Contact Sunrise Construction OBX today for a free consultation on exterior construction 
                      services for your Outer Banks home. Our experienced team is ready to help you create 
                      the coastal property of your dreams.
                    </p>
                    <Link href="/contact" className="btn btn-primary">Get Free Construction Quote</Link>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-4">
                <div className="service-sidebar">
                  <div className="widget">
                    <h4>Construction Specialties</h4>
                    <ul className="list-unstyled">
                      <li>✓ Coastal Underpinning</li>
                      <li>✓ Hurricane-Resistant Porches</li>
                      <li>✓ Beachfront Construction</li>
                      <li>✓ Structural Improvements</li>
                      <li>✓ Coastal Insulation</li>
                      <li>✓ Foundation Work</li>
                    </ul>
                  </div>
                  
                  <div className="widget">
                    <h4>Materials We Use</h4>
                    <ul className="list-unstyled">
                      <li>• Marine-Grade Lumber</li>
                      <li>• Stainless Steel Fasteners</li>
                      <li>• Composite Decking</li>
                      <li>• Hurricane Straps</li>
                      <li>• Vapor Barriers</li>
                      <li>• Spray Foam Insulation</li>
                    </ul>
                  </div>
                  
                  <div className="widget">
                    <h4>Contact Information</h4>
                    <p><strong>Phone:</strong> (252) 207-2602</p>
                    <p><strong>Email:</strong> info@sunriseobx.co</p>
                    <p><strong>Service Area:</strong> All of Outer Banks, NC</p>
                    <p><strong>License:</strong> NC General Contractor</p>
                  </div>
                  
                  <div className="widget">
                    <h4>Related Services</h4>
                    <ul className="list-unstyled">
                      <li><Link href="/services/wincore-windows-outer-banks">Wincore Windows</Link></li>
                      <li><Link href="/services/fortified-roofing-outer-banks">Fortified Roofing</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layouts>
    </>
  );
};

export default ExteriorConstructionPage;