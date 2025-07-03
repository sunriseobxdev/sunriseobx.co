// SEO-optimized Nags Head construction landing page
// Target keywords: "Nags Head construction", "contractors Nags Head NC", "hurricane resistant homes Nags Head"
// Geographic targeting: Nags Head, NC - specific location targeting

import React from 'react';
import { NextSeo } from 'next-seo';
import Layouts from '@layouts/Layouts';
import PageBanner from '@components/PageBanner';
import Link from 'next/link';

const NagsHeadConstructionPage = () => {
  const seoData = {
    title: 'Nags Head Construction Contractors | Hurricane-Resistant Homes NC',
    description: 'Professional construction services in Nags Head, NC. Hurricane-resistant homes, Wincore windows, Fortified roofing, and coastal construction. Licensed Nags Head contractors.',
    canonical: 'https://sunriseobx.co/locations/nags-head-construction',
    keywords: 'Nags Head construction, contractors Nags Head NC, hurricane resistant homes Nags Head, coastal construction Nags Head, Nags Head builders, OBX construction Nags Head',
    openGraph: {
      title: 'Nags Head Construction Contractors | Hurricane-Resistant Homes NC',
      description: 'Professional construction services in Nags Head, NC. Hurricane-resistant homes, Wincore windows, Fortified roofing, and coastal construction. Licensed Nags Head contractors.',
      url: 'https://sunriseobx.co/locations/nags-head-construction',
      type: 'website',
      images: [
        {
          url: 'https://sunriseobx.co/images/nags-head-construction.jpg',
          width: 1200,
          height: 630,
          alt: 'Nags Head Construction Contractors NC',
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
        content: 'Nags Head, North Carolina',
      },
      {
        name: 'geo.position',
        content: '35.9573;-75.6240',
      },
      {
        name: 'ICBM',
        content: '35.9573, -75.6240',
      },
    ],
  };

  const locationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://sunriseobx.co/locations/nags-head-construction',
    name: 'Sunrise Construction OBX - Nags Head',
    description: 'Professional construction services in Nags Head, NC specializing in hurricane-resistant coastal homes',
    url: 'https://sunriseobx.co/locations/nags-head-construction',
    telephone: '(252) 207-2602',
    email: 'info@sunriseobx.co',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '5200 N Croatan Hwy',
      addressLocality: 'Kitty Hawk',
      addressRegion: 'NC',
      postalCode: '27949',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 35.9573,
      longitude: -75.6240,
    },
    areaServed: {
      '@type': 'City',
      name: 'Nags Head',
      sameAs: 'https://en.wikipedia.org/wiki/Nags_Head,_North_Carolina',
    },
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 35.9573,
        longitude: -75.6240,
      },
      geoRadius: '10000',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Construction Services Nags Head',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Hurricane-Resistant Construction Nags Head',
            description: 'Hurricane-resistant home construction and improvements in Nags Head, NC',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Wincore Windows Installation Nags Head',
            description: 'Professional Wincore window installation in Nags Head coastal homes',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Fortified Roofing Nags Head',
            description: 'IBHS Fortified roofing systems for Nags Head hurricane protection',
          },
        },
      ],
    },
  };

  return (
    <>
      <NextSeo {...seoData} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(locationStructuredData),
        }}
      />
      
      <Layouts>
        <PageBanner
          title="Nags Head Construction Contractors"
          subtitle="Hurricane-Resistant Construction Services in Nags Head, NC"
          breadcrumb={[
            { label: 'Home', href: '/' },
            { label: 'Locations', href: '/locations' },
            { label: 'Nags Head', href: '/locations/nags-head-construction' },
          ]}
        />
        
        <section className="location-services py-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8">
                <h1>Professional Construction Services in Nags Head, North Carolina</h1>
                
                <p className="lead">
                  Sunrise Construction OBX is proud to serve Nags Head with comprehensive construction 
                  services designed for coastal living. As experienced Nags Head contractors, we understand 
                  the unique challenges of building and maintaining homes in this beautiful oceanfront community.
                </p>
                
                <h2>Why Choose Our Nags Head Construction Services?</h2>
                <p>
                  Nags Head's oceanfront location presents unique construction challenges that require 
                  specialized knowledge and experience. Our team has been serving the Nags Head community 
                  for over 20 years, providing construction solutions that withstand coastal weather, 
                  salt air, and hurricane conditions.
                </p>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h3>Hurricane-Resistant Construction</h3>
                    <ul>
                      <li>IBHS Fortified construction standards</li>
                      <li>Hurricane-rated windows and doors</li>
                      <li>Reinforced structural systems</li>
                      <li>Impact-resistant materials</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h3>Coastal Expertise</h3>
                    <ul>
                      <li>Salt air corrosion protection</li>
                      <li>Flood-resistant construction</li>
                      <li>Coastal building code compliance</li>
                      <li>Oceanfront construction experience</li>
                    </ul>
                  </div>
                </div>
                
                <h2>Our Nags Head Construction Services</h2>
                
                <div className="services-grid">
                  <div className="service-item mb-4 p-4 border rounded">
                    <h3>Wincore Windows Installation Nags Head</h3>
                    <p>
                      Protect your Nags Head home with professional Wincore window installation. 
                      Our hurricane-resistant windows are designed specifically for oceanfront 
                      properties, providing superior protection against coastal storms and salt air damage.
                    </p>
                    <Link href="/services/wincore-windows-outer-banks" className="btn btn-outline-primary">
                      Learn More About Wincore Windows
                    </Link>
                  </div>
                  
                  <div className="service-item mb-4 p-4 border rounded">
                    <h3>Fortified Roofing Systems Nags Head</h3>
                    <p>
                      Upgrade to IBHS Fortified roofing for maximum hurricane protection in Nags Head. 
                      Our certified Fortified roofing installations meet the highest standards for 
                      coastal construction and qualify for insurance discounts.
                    </p>
                    <Link href="/services/fortified-roofing-outer-banks" className="btn btn-outline-primary">
                      Learn More About Fortified Roofing
                    </Link>
                  </div>
                  
                  <div className="service-item mb-4 p-4 border rounded">
                    <h3>Coastal Exterior Construction Nags Head</h3>
                    <p>
                      Complete exterior construction services for Nags Head homes including underpinning, 
                      porches, structural improvements, and coastal insulation designed for oceanfront living.
                    </p>
                    <Link href="/services/exterior-construction-outer-banks" className="btn btn-outline-primary">
                      Learn More About Exterior Construction
                    </Link>
                  </div>
                </div>
                
                <h2>Nags Head Building Codes & Regulations</h2>
                <p>
                  As licensed North Carolina contractors, we ensure all our Nags Head construction 
                  projects comply with local building codes, including:
                </p>
                <ul>
                  <li>Dare County building requirements</li>
                  <li>Coastal Area Management Act (CAMA) regulations</li>
                  <li>Hurricane wind load requirements</li>
                  <li>Flood zone construction standards</li>
                  <li>Environmental protection guidelines</li>
                </ul>
                
                <h2>Nags Head Construction Project Gallery</h2>
                <p>
                  View our completed construction projects throughout Nags Head, showcasing our 
                  expertise in coastal construction, hurricane-resistant improvements, and quality 
                  craftsmanship that stands up to Outer Banks weather conditions.
                </p>
                
                <div className="cta-section mt-5 p-4 bg-light rounded">
                  <h3>Ready to Start Your Nags Head Construction Project?</h3>
                  <p>
                    Contact Sunrise Construction OBX today for a free consultation on construction 
                    services in Nags Head, NC. Our experienced team is ready to help you create 
                    the coastal home of your dreams.
                  </p>
                  <div className="d-flex flex-wrap gap-3">
                    <Link href="/contact" className="btn btn-primary">Get Free Quote</Link>
                    <a href="tel:(252)207-2602" className="btn btn-outline-primary">Call (252) 207-2602</a>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-4">
                <div className="location-sidebar">
                  <div className="widget">
                    <h4>Nags Head Service Area</h4>
                    <p>
                      We provide comprehensive construction services throughout Nags Head, 
                      from the oceanfront to the soundside communities.
                    </p>
                    <ul className="list-unstyled">
                      <li>• Oceanfront Nags Head</li>
                      <li>• Soundside Nags Head</li>
                      <li>• Nags Head Woods</li>
                      <li>• Village at Nags Head</li>
                    </ul>
                  </div>
                  
                  <div className="widget">
                    <h4>Local Expertise</h4>
                    <ul className="list-unstyled">
                      <li>✓ 20+ Years in Nags Head</li>
                      <li>✓ Licensed NC Contractors</li>
                      <li>✓ Hurricane Construction Experts</li>
                      <li>✓ Local Building Code Knowledge</li>
                      <li>✓ Insurance Approved Work</li>
                    </ul>
                  </div>
                  
                  <div className="widget">
                    <h4>Contact Information</h4>
                    <p><strong>Phone:</strong> (252) 207-2602</p>
                    <p><strong>Email:</strong> info@sunriseobx.co</p>
                    <p><strong>Service Area:</strong> Nags Head & All OBX</p>
                    <p><strong>License:</strong> NC General Contractor</p>
                  </div>
                  
                  <div className="widget">
                    <h4>Other OBX Locations</h4>
                    <ul className="list-unstyled">
                      <li><Link href="/locations/duck-construction">Duck Construction</Link></li>
                      <li><Link href="/locations/kitty-hawk-construction">Kitty Hawk Construction</Link></li>
                      <li><Link href="/locations/kill-devil-hills-construction">Kill Devil Hills Construction</Link></li>
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

export default NagsHeadConstructionPage;