// SEO-optimized Fortified Roofing service page for Outer Banks
// Target keywords: "Fortified roofing Outer Banks", "hurricane roofing OBX", "IBHS Fortified roof NC"
// Geographic targeting: Outer Banks, NC - coastal hurricane protection

import React from 'react';
import { NextSeo } from 'next-seo';
import Layouts from '@layouts/Layouts';
import PageBanner from '@components/PageBanner';
import Link from 'next/link';

const FortifiedRoofingPage = () => {
  const seoData = {
    title: 'IBHS Fortified Roofing Outer Banks | Hurricane Protection Roofing OBX',
    description: 'Professional IBHS Fortified roofing installation in Outer Banks, NC. Hurricane-resistant roofing systems for coastal homes. Certified Fortified roof contractors OBX.',
    canonical: 'https://sunriseobx.co/services/fortified-roofing-outer-banks',
    keywords: 'Fortified roofing Outer Banks, IBHS Fortified roof OBX, hurricane roofing NC, coastal roofing contractors, Nags Head roofing, Duck roofing, Kitty Hawk roofing, hurricane resistant roof',
    openGraph: {
      title: 'IBHS Fortified Roofing Outer Banks | Hurricane Protection Roofing OBX',
      description: 'Professional IBHS Fortified roofing installation in Outer Banks, NC. Hurricane-resistant roofing systems for coastal homes. Certified Fortified roof contractors OBX.',
      url: 'https://sunriseobx.co/services/fortified-roofing-outer-banks',
      type: 'website',
      images: [
        {
          url: 'https://sunriseobx.co/images/fortified-roofing-outer-banks.jpg',
          width: 1200,
          height: 630,
          alt: 'IBHS Fortified Roofing Installation Outer Banks NC',
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
    name: 'IBHS Fortified Roofing Installation Outer Banks',
    description: 'Professional IBHS Fortified roofing systems for hurricane protection in Outer Banks coastal homes',
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
    serviceType: 'Roofing Installation',
    category: 'Hurricane-Resistant Roofing',
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
          title="IBHS Fortified Roofing"
          subtitle="Hurricane Protection Roofing Systems for Outer Banks"
          breadcrumb={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: 'Fortified Roofing', href: '/services/fortified-roofing-outer-banks' },
          ]}
        />
        
        <section className="service-details py-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8">
                <div className="service-content">
                  <h1>IBHS Fortified Roofing Installation in Outer Banks, NC</h1>
                  
                  <p className="lead">
                    Protect your Outer Banks home with IBHS Fortified roofing systems designed specifically 
                    for hurricane-prone coastal areas. Our certified Fortified roof installations provide 
                    superior protection against high winds, flying debris, and severe coastal weather.
                  </p>
                  
                  <h2>What is IBHS Fortified Roofing?</h2>
                  <p>
                    IBHS (Insurance Institute for Business & Home Safety) Fortified roofing is a voluntary 
                    construction standard that strengthens homes against severe weather. Fortified roofs 
                    are engineered to withstand hurricane-force winds and reduce the risk of catastrophic 
                    damage during coastal storms.
                  </p>
                  
                  <h2>Benefits of Fortified Roofing for OBX Homes</h2>
                  <ul>
                    <li><strong>Hurricane Wind Resistance:</strong> Tested to withstand winds up to 130+ mph</li>
                    <li><strong>Insurance Discounts:</strong> Qualify for significant homeowner's insurance savings</li>
                    <li><strong>Enhanced Durability:</strong> Superior materials and installation methods</li>
                    <li><strong>Debris Impact Protection:</strong> Reinforced deck and enhanced attachment</li>
                    <li><strong>Water Intrusion Prevention:</strong> Sealed roof deck and enhanced barriers</li>
                    <li><strong>Increased Home Value:</strong> Fortified certification adds resale value</li>
                  </ul>
                  
                  <h2>Fortified Roofing Standards We Follow</h2>
                  <p>
                    Our IBHS Fortified roofing installations meet all three levels of Fortified standards:
                  </p>
                  
                  <h3>Fortified Roof™</h3>
                  <ul>
                    <li>Sealed roof deck with enhanced attachment</li>
                    <li>Ring shank nails every 6 inches on edges</li>
                    <li>Proper starter strip installation</li>
                    <li>Enhanced ridge cap attachment</li>
                  </ul>
                  
                  <h3>Fortified Silver™</h3>
                  <ul>
                    <li>All Fortified Roof requirements</li>
                    <li>Impact-resistant shingles or metal roofing</li>
                    <li>Enhanced gutter attachment</li>
                    <li>Proper flashing installation</li>
                  </ul>
                  
                  <h3>Fortified Gold™</h3>
                  <ul>
                    <li>All Fortified Silver requirements</li>
                    <li>Impact-resistant windows and doors</li>
                    <li>Reinforced garage doors</li>
                    <li>Complete building envelope protection</li>
                  </ul>
                  
                  <h2>Our Fortified Roofing Installation Process</h2>
                  <ol>
                    <li><strong>Initial Assessment:</strong> Comprehensive evaluation of your current roof</li>
                    <li><strong>Design & Planning:</strong> Custom Fortified system design for your home</li>
                    <li><strong>Material Selection:</strong> High-quality, hurricane-rated roofing materials</li>
                    <li><strong>Professional Installation:</strong> Certified Fortified installation techniques</li>
                    <li><strong>Third-Party Inspection:</strong> Independent verification of Fortified standards</li>
                    <li><strong>Certification:</strong> Official IBHS Fortified designation and documentation</li>
                  </ol>
                  
                  <h2>Service Areas Throughout Outer Banks</h2>
                  <p>
                    We provide certified IBHS Fortified roofing installation throughout the OBX region:
                  </p>
                  <ul>
                    <li>Nags Head Fortified roofing</li>
                    <li>Duck hurricane roofing</li>
                    <li>Kitty Hawk roof replacement</li>
                    <li>Kill Devil Hills roofing contractors</li>
                    <li>Manteo coastal roofing</li>
                    <li>Hatteras hurricane protection roofing</li>
                  </ul>
                  
                  <h2>Insurance Benefits & Savings</h2>
                  <p>
                    IBHS Fortified roofing can qualify your Outer Banks home for substantial insurance 
                    discounts. Many insurance companies offer premium reductions of 10-45% for homes 
                    with Fortified certification. Contact us to learn about current insurance incentives 
                    available in North Carolina.
                  </p>
                  
                  <div className="cta-section mt-5 p-4 bg-light rounded">
                    <h3>Protect Your OBX Home with Fortified Roofing</h3>
                    <p>
                      Ready to upgrade to IBHS Fortified roofing? Contact Sunrise Construction OBX 
                      for a free consultation on hurricane-resistant roofing for your Outer Banks home. 
                      Our certified installers will help you achieve Fortified certification.
                    </p>
                    <Link href="/contact" className="btn btn-primary">Get Free Fortified Roof Quote</Link>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-4">
                <div className="service-sidebar">
                  <div className="widget">
                    <h4>Fortified Certification</h4>
                    <ul className="list-unstyled">
                      <li>✓ IBHS Certified Contractor</li>
                      <li>✓ Third-Party Inspected</li>
                      <li>✓ Hurricane Wind Tested</li>
                      <li>✓ Insurance Approved</li>
                      <li>✓ Lifetime Warranty</li>
                      <li>✓ Free Estimates</li>
                    </ul>
                  </div>
                  
                  <div className="widget">
                    <h4>Roofing Materials</h4>
                    <ul className="list-unstyled">
                      <li>• Impact-Resistant Shingles</li>
                      <li>• Metal Roofing Systems</li>
                      <li>• Enhanced Underlayment</li>
                      <li>• Hurricane Straps</li>
                      <li>• Sealed Roof Decking</li>
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
                      <li><Link href="/services/wincore-windows-outer-banks">Wincore Windows</Link></li>
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

export default FortifiedRoofingPage;