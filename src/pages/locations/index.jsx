// SEO-optimized Locations index page for Outer Banks construction
// Target keywords: "Outer Banks construction locations", "OBX contractors service areas", "coastal construction NC"
// Geographic targeting: All Outer Banks locations

import React from 'react';
import { NextSeo } from 'next-seo';
import Layouts from '@layouts/Layouts';
import PageBanner from '@components/PageBanner';
import Link from 'next/link';

const LocationsPage = () => {
  const seoData = {
    title: 'Outer Banks Construction Service Areas | OBX Contractors Locations',
    description: 'Professional construction services throughout Outer Banks, NC. Serving Nags Head, Duck, Kitty Hawk, Kill Devil Hills, Manteo, and all OBX communities with hurricane-resistant construction.',
    canonical: 'https://sunriseobx.co/locations',
    keywords: 'Outer Banks construction locations, OBX contractors service areas, coastal construction NC, hurricane resistant construction OBX, Nags Head Duck Kitty Hawk contractors',
    openGraph: {
      title: 'Outer Banks Construction Service Areas | OBX Contractors Locations',
      description: 'Professional construction services throughout Outer Banks, NC. Serving Nags Head, Duck, Kitty Hawk, Kill Devil Hills, Manteo, and all OBX communities with hurricane-resistant construction.',
      url: 'https://sunriseobx.co/locations',
      type: 'website',
      images: [
        {
          url: 'https://sunriseobx.co/images/outer-banks-construction-locations.jpg',
          width: 1200,
          height: 630,
          alt: 'Outer Banks Construction Service Areas',
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

  const locations = [
    {
      name: 'Nags Head',
      title: 'Nags Head Construction Contractors',
      description: 'Professional construction services in Nags Head, NC. Hurricane-resistant homes, oceanfront construction, and coastal building expertise for this premier OBX destination.',
      link: '/locations/nags-head-construction',
      image: '/images/nags-head-construction.jpg',
      coordinates: { lat: 35.9573, lng: -75.6240 },
      specialties: ['Oceanfront Construction', 'Hurricane Protection', 'Coastal Renovations', 'Wincore Windows']
    },
    {
      name: 'Duck',
      title: 'Duck Construction Contractors',
      description: 'Luxury coastal construction services in Duck, NC. Specializing in high-end oceanfront homes, beachfront construction, and premium building solutions.',
      link: '/locations/duck-construction',
      image: '/images/duck-construction.jpg',
      coordinates: { lat: 36.1611, lng: -75.7466 },
      specialties: ['Luxury Homes', 'Beachfront Construction', 'Premium Materials', 'Architectural Excellence']
    },
    {
      name: 'Kitty Hawk',
      title: 'Kitty Hawk Construction Contractors',
      description: 'Comprehensive construction services in Kitty Hawk, NC. From residential construction to commercial projects, serving the heart of the Outer Banks.',
      link: '/locations/kitty-hawk-construction',
      image: '/images/kitty-hawk-construction.jpg',
      coordinates: { lat: 36.1063, lng: -75.7135 },
      specialties: ['Residential Construction', 'Commercial Projects', 'Home Renovations', 'Fortified Roofing']
    },
    {
      name: 'Kill Devil Hills',
      title: 'Kill Devil Hills Construction Contractors',
      description: 'Expert construction services in Kill Devil Hills, NC. Hurricane-resistant construction, home improvements, and coastal building solutions.',
      link: '/locations/kill-devil-hills-construction',
      image: '/images/kill-devil-hills-construction.jpg',
      coordinates: { lat: 36.0293, lng: -75.6730 },
      specialties: ['Hurricane Resistance', 'Home Improvements', 'Exterior Construction', 'Coastal Expertise']
    },
    {
      name: 'Manteo',
      title: 'Manteo Construction Contractors',
      description: 'Professional construction services in Manteo, NC. Historic preservation, waterfront construction, and traditional coastal building techniques.',
      link: '/locations/manteo-construction',
      image: '/images/manteo-construction.jpg',
      coordinates: { lat: 35.9088, lng: -75.6696 },
      specialties: ['Historic Preservation', 'Waterfront Construction', 'Traditional Building', 'Restoration Work']
    },
    {
      name: 'Hatteras',
      title: 'Hatteras Construction Contractors',
      description: 'Specialized construction services in Hatteras, NC. Extreme weather construction, fishing village expertise, and remote location building solutions.',
      link: '/locations/hatteras-construction',
      image: '/images/hatteras-construction.jpg',
      coordinates: { lat: 35.2269, lng: -75.6874 },
      specialties: ['Extreme Weather Construction', 'Remote Building', 'Fishing Village Expertise', 'Storm Recovery']
    }
  ];

  const serviceAreasStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Outer Banks Construction Service Areas',
    description: 'Professional construction services throughout all Outer Banks communities',
    itemListElement: locations.map((location, index) => ({
      '@type': 'Place',
      position: index + 1,
      name: location.name,
      description: location.description,
      url: `https://sunriseobx.co${location.link}`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: location.coordinates.lat,
        longitude: location.coordinates.lng,
      },
      containedInPlace: {
        '@type': 'State',
        name: 'North Carolina',
        containedInPlace: {
          '@type': 'Country',
          name: 'United States',
        },
      },
    }))
  };

  return (
    <>
      <NextSeo {...seoData} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceAreasStructuredData),
        }}
      />
      
      <Layouts>
        <PageBanner
          title="Our Service Areas"
          subtitle="Professional Construction Services Throughout the Outer Banks"
          breadcrumb={[
            { label: 'Home', href: '/' },
            { label: 'Locations', href: '/locations' },
          ]}
        />
        
        <section className="service-areas py-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8 mx-auto text-center mb-5">
                <h1>Outer Banks Construction Service Areas</h1>
                <p className="lead">
                  Sunrise Construction OBX proudly serves the entire Outer Banks region with 
                  professional construction services. From Corolla to Hatteras, we bring 
                  decades of coastal construction expertise to every community in the OBX.
                </p>
              </div>
            </div>
            
            <div className="row">
              {locations.map((location, index) => (
                <div key={index} className="col-lg-6 mb-4">
                  <div className="location-card h-100 border rounded shadow-sm overflow-hidden">
                    <div className="location-image">
                      <img 
                        src={location.image} 
                        alt={location.title}
                        className="w-100"
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="location-content p-4">
                      <h3 className="h4 mb-3">{location.title}</h3>
                      <p className="mb-3">{location.description}</p>
                      
                      <div className="specialties mb-3">
                        <h5 className="h6 mb-2">Our Specialties in {location.name}:</h5>
                        <div className="d-flex flex-wrap gap-1">
                          {location.specialties.map((specialty, specialtyIndex) => (
                            <span 
                              key={specialtyIndex} 
                              className="badge bg-light text-dark border"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <Link href={location.link} className="btn btn-primary">
                        Learn More About {location.name} Services
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section className="service-coverage py-5 bg-light">
          <div className="container">
            <div className="row">
              <div className="col-lg-6">
                <h2>Complete Outer Banks Coverage</h2>
                <p>
                  With over 20 years of experience in the Outer Banks, Sunrise Construction OBX 
                  has built a reputation for excellence throughout the entire region. We understand 
                  the unique challenges and requirements of each OBX community.
                </p>
                
                <h3>Why Choose Local OBX Contractors?</h3>
                <ul>
                  <li><strong>Local Knowledge:</strong> Deep understanding of OBX building codes and regulations</li>
                  <li><strong>Weather Expertise:</strong> Experience with coastal storms and hurricane conditions</li>
                  <li><strong>Community Connections:</strong> Established relationships with local suppliers and inspectors</li>
                  <li><strong>Quick Response:</strong> Local presence means faster service and support</li>
                </ul>
              </div>
              
              <div className="col-lg-6">
                <h3>Our Service Area Includes:</h3>
                <div className="row">
                  <div className="col-md-6">
                    <ul className="list-unstyled">
                      <li>• Corolla</li>
                      <li>• Duck</li>
                      <li>• Southern Shores</li>
                      <li>• Kitty Hawk</li>
                      <li>• Kill Devil Hills</li>
                      <li>• Nags Head</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul className="list-unstyled">
                      <li>• Manteo</li>
                      <li>• Wanchese</li>
                      <li>• Rodanthe</li>
                      <li>• Waves</li>
                      <li>• Salvo</li>
                      <li>• Avon</li>
                      <li>• Buxton</li>
                      <li>• Frisco</li>
                      <li>• Hatteras</li>
                      <li>• Ocracoke</li>
                    </ul>
                  </div>
                </div>
                
                <p className="mt-3">
                  <strong>Don't see your location listed?</strong> We serve the entire Outer Banks region. 
                  Contact us to discuss your specific location and construction needs.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="construction-expertise py-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8 mx-auto text-center mb-5">
                <h2>Coastal Construction Expertise</h2>
                <p>
                  Every Outer Banks location presents unique construction challenges. Our team 
                  brings specialized expertise to each community we serve.
                </p>
              </div>
            </div>
            
            <div className="row">
              <div className="col-lg-3 col-md-6 mb-4">
                <div className="expertise-item text-center">
                  <div className="expertise-icon mb-3">
                    <i className="fas fa-home fa-3x text-primary"></i>
                  </div>
                  <h4>Hurricane Resistance</h4>
                  <p>Advanced construction techniques for maximum storm protection</p>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6 mb-4">
                <div className="expertise-item text-center">
                  <div className="expertise-icon mb-3">
                    <i className="fas fa-water fa-3x text-primary"></i>
                  </div>
                  <h4>Coastal Conditions</h4>
                  <p>Specialized materials and methods for salt air and flooding</p>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6 mb-4">
                <div className="expertise-item text-center">
                  <div className="expertise-icon mb-3">
                    <i className="fas fa-certificate fa-3x text-primary"></i>
                  </div>
                  <h4>Code Compliance</h4>
                  <p>Expert knowledge of local building codes and regulations</p>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6 mb-4">
                <div className="expertise-item text-center">
                  <div className="expertise-icon mb-3">
                    <i className="fas fa-tools fa-3x text-primary"></i>
                  </div>
                  <h4>Quality Craftsmanship</h4>
                  <p>Superior workmanship that stands up to coastal conditions</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="cta-section py-5 bg-primary text-white">
          <div className="container">
            <div className="row">
              <div className="col-lg-8 mx-auto text-center">
                <h2>Ready to Start Your OBX Construction Project?</h2>
                <p className="lead mb-4">
                  No matter where you're located in the Outer Banks, Sunrise Construction OBX 
                  is ready to help with your construction needs. Contact us today for a free 
                  consultation and discover why we're the trusted choice throughout the OBX.
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <Link href="/contact" className="btn btn-light btn-lg">Get Free Quote</Link>
                  <a href="tel:(252)207-2602" className="btn btn-outline-light btn-lg">Call (252) 207-2602</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layouts>
    </>
  );
};

export default LocationsPage;