// SEO-optimized Duck construction landing page
// Target keywords: "Duck construction", "contractors Duck NC", "hurricane resistant homes Duck"
// Geographic targeting: Duck, NC - specific location targeting

import React from 'react';
import { NextSeo } from 'next-seo';
import Layouts from '@layouts/Layouts';
import PageBanner from '@components/PageBanner';
import Link from 'next/link';

const DuckConstructionPage = () => {
  const seoData = {
    title: 'Duck Construction Contractors | Hurricane-Resistant Homes Duck NC',
    description: 'Professional construction services in Duck, NC. Hurricane-resistant homes, Wincore windows, Fortified roofing, and coastal construction. Licensed Duck contractors.',
    canonical: 'https://sunriseobx.co/locations/duck-construction',
    keywords: 'Duck construction, contractors Duck NC, hurricane resistant homes Duck, coastal construction Duck, Duck builders, OBX construction Duck, beachfront construction Duck',
    openGraph: {
      title: 'Duck Construction Contractors | Hurricane-Resistant Homes Duck NC',
      description: 'Professional construction services in Duck, NC. Hurricane-resistant homes, Wincore windows, Fortified roofing, and coastal construction. Licensed Duck contractors.',
      url: 'https://sunriseobx.co/locations/duck-construction',
      type: 'website',
      images: [
        {
          url: 'https://sunriseobx.co/images/duck-construction.jpg',
          width: 1200,
          height: 630,
          alt: 'Duck Construction Contractors NC',
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
        content: 'Duck, North Carolina',
      },
      {
        name: 'geo.position',
        content: '36.1611;-75.7466',
      },
      {
        name: 'ICBM',
        content: '36.1611, -75.7466',
      },
    ],
  };

  const locationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://sunriseobx.co/locations/duck-construction',
    name: 'Sunrise Construction OBX - Duck',
    description: 'Professional construction services in Duck, NC specializing in hurricane-resistant coastal homes and beachfront construction',
    url: 'https://sunriseobx.co/locations/duck-construction',
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
      latitude: 36.1611,
      longitude: -75.7466,
    },
    areaServed: {
      '@type': 'City',
      name: 'Duck',
      sameAs: 'https://en.wikipedia.org/wiki/Duck,_North_Carolina',
    },
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 36.1611,
        longitude: -75.7466,
      },
      geoRadius: '10000',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Construction Services Duck',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Beachfront Construction Duck',
            description: 'Specialized beachfront and oceanfront construction services in Duck, NC',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Hurricane-Resistant Homes Duck',
            description: 'Hurricane-resistant home construction and improvements in Duck, NC',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Luxury Home Construction Duck',
            description: 'Custom luxury home construction for Duck oceanfront properties',
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
          title="Duck Construction Contractors"
          subtitle="Luxury Coastal Construction Services in Duck, NC"
          breadcrumb={[
            { label: 'Home', href: '/' },
            { label: 'Locations', href: '/locations' },
            { label: 'Duck', href: '/locations/duck-construction' },
          ]}
        />
        
        <section className="location-services py-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8">
                <h1>Professional Construction Services in Duck, North Carolina</h1>
                
                <p className="lead">
                  Sunrise Construction OBX specializes in luxury coastal construction services in Duck, NC. 
                  As experienced Duck contractors, we understand the unique requirements of building 
                  high-end oceanfront and soundside homes in this exclusive Outer Banks community.
                </p>
                
                <h2>Duck's Unique Construction Challenges</h2>
                <p>
                  Duck's pristine oceanfront location and upscale community standards require construction 
                  expertise that goes beyond typical coastal building. Our team has extensive experience 
                  working within Duck's strict building guidelines while delivering the luxury finishes 
                  and hurricane protection that Duck homeowners expect.
                </p>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h3>Luxury Coastal Construction</h3>
                    <ul>
                      <li>Custom oceanfront home design</li>
                      <li>High-end material selection</li>
                      <li>Luxury finish carpentry</li>
                      <li>Premium coastal fixtures</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h3>Duck Building Standards</h3>
                    <ul>
                      <li>Strict architectural guidelines</li>
                      <li>Environmental protection compliance</li>
                      <li>Premium construction materials</li>
                      <li>Enhanced hurricane protection</li>
                    </ul>
                  </div>
                </div>
                
                <h2>Our Duck Construction Specialties</h2>
                
                <div className="services-grid">
                  <div className="service-item mb-4 p-4 border rounded">
                    <h3>Oceanfront Home Construction Duck</h3>
                    <p>
                      Build your dream oceanfront home in Duck with our specialized coastal construction 
                      services. We understand Duck's unique environmental challenges and building 
                      requirements for luxury oceanfront properties.
                    </p>
                    <ul>
                      <li>Custom oceanfront design</li>
                      <li>Hurricane-resistant construction</li>
                      <li>Luxury coastal finishes</li>
                      <li>Environmental compliance</li>
                    </ul>
                  </div>
                  
                  <div className="service-item mb-4 p-4 border rounded">
                    <h3>Premium Wincore Windows Duck</h3>
                    <p>
                      Protect your Duck home investment with premium Wincore window systems. 
                      Our hurricane-rated windows provide superior protection while maintaining 
                      the aesthetic standards expected in Duck's luxury market.
                    </p>
                    <Link href="/services/wincore-windows-outer-banks" className="btn btn-outline-primary">
                      Learn More About Wincore Windows
                    </Link>
                  </div>
                  
                  <div className="service-item mb-4 p-4 border rounded">
                    <h3>Fortified Roofing Systems Duck</h3>
                    <p>
                      Upgrade to IBHS Fortified roofing for maximum hurricane protection in Duck. 
                      Our premium roofing systems combine superior storm protection with the 
                      architectural beauty required for Duck's luxury homes.
                    </p>
                    <Link href="/services/fortified-roofing-outer-banks" className="btn btn-outline-primary">
                      Learn More About Fortified Roofing
                    </Link>
                  </div>
                  
                  <div className="service-item mb-4 p-4 border rounded">
                    <h3>Luxury Exterior Construction Duck</h3>
                    <p>
                      Complete exterior construction and renovation services for Duck homes including 
                      custom porches, luxury underpinning, premium siding, and architectural 
                      enhancements that meet Duck's high standards.
                    </p>
                    <Link href="/services/exterior-construction-outer-banks" className="btn btn-outline-primary">
                      Learn More About Exterior Construction
                    </Link>
                  </div>
                </div>
                
                <h2>Duck Building Regulations & Standards</h2>
                <p>
                  Duck maintains some of the strictest building standards in the Outer Banks. 
                  Our team is well-versed in Duck's specific requirements:
                </p>
                <ul>
                  <li>Duck Town architectural review board approval</li>
                  <li>Coastal Area Management Act (CAMA) compliance</li>
                  <li>Enhanced hurricane wind load requirements</li>
                  <li>Environmental protection standards</li>
                  <li>Premium material and finish requirements</li>
                  <li>Setback and height restrictions</li>
                </ul>
                
                <h2>Why Duck Homeowners Choose Sunrise Construction OBX</h2>
                <div className="row">
                  <div className="col-md-6">
                    <ul>
                      <li><strong>Luxury Experience:</strong> 20+ years building high-end Duck homes</li>
                      <li><strong>Local Expertise:</strong> Deep knowledge of Duck building requirements</li>
                      <li><strong>Premium Materials:</strong> Only the finest coastal-grade materials</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul>
                      <li><strong>Hurricane Protection:</strong> Advanced storm-resistant construction</li>
                      <li><strong>Architectural Excellence:</strong> Beautiful designs that meet Duck standards</li>
                      <li><strong>Full Service:</strong> Complete construction and renovation services</li>
                    </ul>
                  </div>
                </div>
                
                <div className="cta-section mt-5 p-4 bg-light rounded">
                  <h3>Ready to Build Your Dream Home in Duck?</h3>
                  <p>
                    Contact Sunrise Construction OBX today for a consultation on luxury construction 
                    services in Duck, NC. Our experienced team is ready to help you create the 
                    perfect coastal home in this exclusive Outer Banks community.
                  </p>
                  <div className="d-flex flex-wrap gap-3">
                    <Link href="/contact" className="btn btn-primary">Get Free Consultation</Link>
                    <a href="tel:(252)207-2602" className="btn btn-outline-primary">Call (252) 207-2602</a>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-4">
                <div className="location-sidebar">
                  <div className="widget">
                    <h4>Duck Service Areas</h4>
                    <p>
                      We provide luxury construction services throughout Duck's 
                      exclusive oceanfront and soundside communities.
                    </p>
                    <ul className="list-unstyled">
                      <li>• Oceanfront Duck</li>
                      <li>• Soundside Duck</li>
                      <li>• Duck Village</li>
                      <li>• Sanderling Resort Area</li>
                    </ul>
                  </div>
                  
                  <div className="widget">
                    <h4>Duck Specialties</h4>
                    <ul className="list-unstyled">
                      <li>✓ Luxury Oceanfront Homes</li>
                      <li>✓ Hurricane-Resistant Construction</li>
                      <li>✓ Premium Material Selection</li>
                      <li>✓ Architectural Review Compliance</li>
                      <li>✓ Environmental Protection</li>
                    </ul>
                  </div>
                  
                  <div className="widget">
                    <h4>Contact Information</h4>
                    <p><strong>Phone:</strong> (252) 207-2602</p>
                    <p><strong>Email:</strong> info@sunriseobx.co</p>
                    <p><strong>Service Area:</strong> Duck & All OBX</p>
                    <p><strong>License:</strong> NC General Contractor</p>
                  </div>
                  
                  <div className="widget">
                    <h4>Other OBX Locations</h4>
                    <ul className="list-unstyled">
                      <li><Link href="/locations/nags-head-construction">Nags Head Construction</Link></li>
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

export default DuckConstructionPage;