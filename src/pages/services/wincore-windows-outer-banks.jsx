// SEO-optimized Wincore Windows service page for Outer Banks
// Target keywords: "Wincore windows Outer Banks", "hurricane windows OBX", "coastal window installation"
// Geographic targeting: Outer Banks, NC - Nags Head, Duck, Kitty Hawk, Kill Devil Hills

import React from 'react';
import { NextSeo } from 'next-seo';
import Layouts from '@layouts/Layouts';
import PageBanner from '@components/PageBanner';
import Link from 'next/link';

const WincoreWindowsPage = () => {
  const seoData = {
    title: 'Wincore Windows Installation Outer Banks | Hurricane-Resistant Windows OBX',
    description: 'Professional Wincore window installation in Outer Banks, NC. Hurricane-resistant windows for coastal homes in Nags Head, Duck, Kitty Hawk. Expert OBX window contractors.',
    canonical: 'https://sunriseobx.co/services/wincore-windows-outer-banks',
    keywords: 'Wincore windows Outer Banks, hurricane windows OBX, coastal window installation, Nags Head windows, Duck windows, Kitty Hawk windows, Kill Devil Hills windows, hurricane resistant windows NC',
    openGraph: {
      title: 'Wincore Windows Installation Outer Banks | Hurricane-Resistant Windows OBX',
      description: 'Professional Wincore window installation in Outer Banks, NC. Hurricane-resistant windows for coastal homes in Nags Head, Duck, Kitty Hawk. Expert OBX window contractors.',
      url: 'https://sunriseobx.co/services/wincore-windows-outer-banks',
      type: 'website',
      images: [
        {
          url: 'https://sunriseobx.co/images/wincore-windows-outer-banks.jpg',
          width: 1200,
          height: 630,
          alt: 'Wincore Windows Installation Outer Banks NC',
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
    name: 'Wincore Windows Installation Outer Banks',
    description: 'Professional Wincore window installation services for hurricane-resistant coastal homes in Outer Banks, NC',
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
    serviceType: 'Window Installation',
    category: 'Hurricane-Resistant Windows',
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
          title="Wincore Windows Installation"
          subtitle="Hurricane-Resistant Windows for Outer Banks Homes"
          breadcrumb={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: 'Wincore Windows', href: '/services/wincore-windows-outer-banks' },
          ]}
        />
        
        <section className="service-details py-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8">
                <div className="service-content">
                  <h1>Professional Wincore Windows Installation in Outer Banks, NC</h1>
                  
                  <p className="lead">
                    Protect your Outer Banks home with professional Wincore window installation services. 
                    Our hurricane-resistant windows are specifically designed for coastal environments, 
                    providing superior protection against storms, salt air, and extreme weather conditions.
                  </p>
                  
                  <h2>Why Choose Wincore Windows for Your OBX Home?</h2>
                  <ul>
                    <li><strong>Hurricane Protection:</strong> Impact-resistant glass and reinforced frames</li>
                    <li><strong>Salt Air Resistance:</strong> Corrosion-resistant materials for coastal durability</li>
                    <li><strong>Energy Efficiency:</strong> Low-E coatings reduce cooling costs in hot OBX summers</li>
                    <li><strong>UV Protection:</strong> Blocks harmful rays that fade furniture and flooring</li>
                    <li><strong>Sound Reduction:</strong> Quieter indoor environment despite coastal winds</li>
                  </ul>
                  
                  <h2>Our Wincore Window Installation Process</h2>
                  <p>
                    As certified Wincore dealers serving the Outer Banks, we follow strict installation 
                    protocols to ensure your windows perform optimally in our unique coastal environment:
                  </p>
                  
                  <ol>
                    <li><strong>Site Assessment:</strong> Evaluation of your home's specific coastal exposure</li>
                    <li><strong>Custom Measurement:</strong> Precise measurements for perfect fit and seal</li>
                    <li><strong>Professional Installation:</strong> Expert installation with coastal-grade sealants</li>
                    <li><strong>Quality Inspection:</strong> Thorough testing for air and water infiltration</li>
                    <li><strong>Warranty Registration:</strong> Complete warranty documentation and registration</li>
                  </ol>
                  
                  <h2>Service Areas in Outer Banks</h2>
                  <p>
                    We provide professional Wincore window installation throughout the Outer Banks region:
                  </p>
                  <ul>
                    <li>Nags Head window installation</li>
                    <li>Duck window replacement</li>
                    <li>Kitty Hawk window contractors</li>
                    <li>Kill Devil Hills window services</li>
                    <li>Manteo window installation</li>
                    <li>Hatteras window replacement</li>
                  </ul>
                  
                  <h2>Hurricane Window Certification</h2>
                  <p>
                    All our Wincore windows meet or exceed North Carolina building codes for coastal 
                    construction. Our installations are certified for hurricane zones and qualify for 
                    insurance discounts in many cases.
                  </p>
                  
                  <div className="cta-section mt-5 p-4 bg-light rounded">
                    <h3>Ready to Upgrade Your OBX Home's Windows?</h3>
                    <p>
                      Contact Sunrise Construction OBX today for a free consultation on Wincore window 
                      installation for your Outer Banks home. Our certified installers are ready to 
                      protect your coastal property.
                    </p>
                    <Link href="/contact" className="btn btn-primary">Get Free Quote</Link>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-4">
                <div className="service-sidebar">
                  <div className="widget">
                    <h4>Service Highlights</h4>
                    <ul className="list-unstyled">
                      <li>✓ Certified Wincore Dealer</li>
                      <li>✓ Hurricane-Rated Windows</li>
                      <li>✓ Coastal Installation Experts</li>
                      <li>✓ Insurance Approved</li>
                      <li>✓ Full Warranty Coverage</li>
                      <li>✓ Free Estimates</li>
                    </ul>
                  </div>
                  
                  <div className="widget">
                    <h4>Contact Information</h4>
                    <p><strong>Phone:</strong> (252) 207-2602</p>
                    <p><strong>Email:</strong> info@sunriseobx.co</p>
                    <p><strong>Service Area:</strong> All of Outer Banks, NC</p>
                  </div>
                  
                  <div className="widget">
                    <h4>Related Services</h4>
                    <ul className="list-unstyled">
                      <li><Link href="/services/fortified-roofing-outer-banks">Fortified Roofing</Link></li>
                      <li><Link href="/services/exterior-construction-outer-banks">Exterior Construction</Link></li>
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

export default WincoreWindowsPage;