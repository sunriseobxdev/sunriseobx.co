// SEO-optimized Services index page for Outer Banks construction
// Target keywords: "construction services Outer Banks", "OBX contractors", "coastal construction services"
// Geographic targeting: Outer Banks, NC - comprehensive construction services

import React from 'react';
import { NextSeo } from 'next-seo';
import Layouts from '@layouts/Layouts';
import PageBanner from '@components/PageBanner';
import Link from 'next/link';

const ServicesPage = () => {
  const seoData = {
    title: 'Construction Services Outer Banks | Professional OBX Contractors',
    description: 'Comprehensive construction services in Outer Banks, NC. Hurricane-resistant construction, Wincore windows, Fortified roofing, and coastal exterior construction for OBX homes.',
    canonical: 'https://sunriseobx.co/services',
    keywords: 'construction services Outer Banks, OBX contractors, coastal construction NC, hurricane resistant construction, Nags Head contractors, Duck construction, Kitty Hawk builders',
    openGraph: {
      title: 'Construction Services Outer Banks | Professional OBX Contractors',
      description: 'Comprehensive construction services in Outer Banks, NC. Hurricane-resistant construction, Wincore windows, Fortified roofing, and coastal exterior construction for OBX homes.',
      url: 'https://sunriseobx.co/services',
      type: 'website',
      images: [
        {
          url: 'https://sunriseobx.co/images/construction-services-outer-banks.jpg',
          width: 1200,
          height: 630,
          alt: 'Construction Services Outer Banks NC',
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

  const services = [
    {
      title: 'Wincore Windows Installation',
      description: 'Professional Wincore window installation services for Outer Banks homes. Hurricane-resistant windows designed to protect your OBX property from coastal storms and salt air damage.',
      link: '/services/wincore-windows-outer-banks',
      icon: '/images/icon-1.svg',
      features: [
        'Hurricane-resistant glass',
        'Salt air corrosion protection',
        'Energy efficient Low-E coatings',
        'Professional installation',
        'Full warranty coverage'
      ]
    },
    {
      title: 'IBHS Fortified Roofing',
      description: 'IBHS Fortified roofing systems for Outer Banks homes. Protect your coastal property against hurricanes, high winds, and severe coastal weather with our certified roofing solutions.',
      link: '/services/fortified-roofing-outer-banks',
      icon: '/images/icon-2.svg',
      features: [
        'IBHS Fortified certification',
        'Hurricane wind resistance',
        'Insurance premium discounts',
        'Impact-resistant materials',
        'Third-party inspected'
      ]
    },
    {
      title: 'Coastal Exterior Construction',
      description: 'Complete exterior construction services for Outer Banks homes including underpinning, coastal insulation, hurricane-resistant porches, and beachfront structural improvements.',
      link: '/services/exterior-construction-outer-banks',
      icon: '/images/icon-3.svg',
      features: [
        'Coastal underpinning',
        'Hurricane-resistant porches',
        'Beachfront construction',
        'Structural improvements',
        'Marine-grade materials'
      ]
    }
  ];

  const serviceStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Construction Services Outer Banks',
    description: 'Professional construction services for coastal homes in Outer Banks, NC',
    itemListElement: services.map((service, index) => ({
      '@type': 'Service',
      position: index + 1,
      name: service.title,
      description: service.description,
      url: `https://sunriseobx.co${service.link}`,
      provider: {
        '@type': 'GeneralContractor',
        name: 'Sunrise Construction OBX',
        url: 'https://sunriseobx.co',
        telephone: '(252) 207-2602',
      }
    }))
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
          title="Construction Services"
          subtitle="Professional Coastal Construction Solutions for Outer Banks"
          breadcrumb={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
          ]}
        />
        
        <section className="services-overview py-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8 mx-auto text-center mb-5">
                <h1>Comprehensive Construction Services for Outer Banks Homes</h1>
                <p className="lead">
                  Sunrise Construction OBX specializes in hurricane-resistant construction services 
                  designed specifically for coastal environments. With over 20 years of experience 
                  in the Outer Banks, we understand the unique challenges of coastal construction 
                  and provide solutions that protect and enhance your OBX property.
                </p>
              </div>
            </div>
            
            <div className="row">
              {services.map((service, index) => (
                <div key={index} className="col-lg-4 col-md-6 mb-4">
                  <div className="service-card h-100 p-4 border rounded shadow-sm">
                    <div className="service-icon mb-3">
                      <img src={service.icon} alt={service.title} width="60" height="60" />
                    </div>
                    <h3 className="h4 mb-3">{service.title}</h3>
                    <p className="mb-3">{service.description}</p>
                    
                    <ul className="list-unstyled mb-4">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="mb-1">
                          <i className="fas fa-check text-primary me-2"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Link href={service.link} className="btn btn-outline-primary">
                      Learn More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section className="why-choose-us py-5 bg-light">
          <div className="container">
            <div className="row">
              <div className="col-lg-6">
                <h2>Why Choose Sunrise Construction OBX?</h2>
                <p>
                  As Outer Banks construction specialists, we bring decades of coastal building 
                  experience to every project. Our team understands the unique environmental 
                  challenges of OBX construction and uses only the highest quality materials 
                  and techniques.
                </p>
                
                <div className="row">
                  <div className="col-md-6">
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="fas fa-shield-alt text-primary me-2"></i>
                        Hurricane-resistant construction
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-certificate text-primary me-2"></i>
                        Licensed & insured contractors
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-tools text-primary me-2"></i>
                        20+ years OBX experience
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="fas fa-star text-primary me-2"></i>
                        Quality materials & workmanship
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-handshake text-primary me-2"></i>
                        Comprehensive warranties
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-map-marker-alt text-primary me-2"></i>
                        Local Outer Banks company
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-6">
                <h3>Service Areas Throughout Outer Banks</h3>
                <p>
                  We provide professional construction services throughout the entire 
                  Outer Banks region, from Corolla to Hatteras:
                </p>
                
                <div className="row">
                  <div className="col-md-6">
                    <ul className="list-unstyled">
                      <li>• Nags Head</li>
                      <li>• Duck</li>
                      <li>• Kitty Hawk</li>
                      <li>• Kill Devil Hills</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul className="list-unstyled">
                      <li>• Manteo</li>
                      <li>• Hatteras</li>
                      <li>• Corolla</li>
                      <li>• Avon</li>
                    </ul>
                  </div>
                </div>
                
                <p className="mt-3">
                  <strong>Contact us today for a free consultation on any of our construction services!</strong>
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="construction-process py-5">
          <div className="container">
            <div className="row">
              <div className="col-lg-8 mx-auto text-center mb-5">
                <h2>Our Construction Process</h2>
                <p>
                  Every project follows our proven process to ensure quality results 
                  that meet the demanding requirements of coastal construction.
                </p>
              </div>
            </div>
            
            <div className="row">
              <div className="col-lg-3 col-md-6 mb-4">
                <div className="process-step text-center">
                  <div className="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    1
                  </div>
                  <h4>Consultation</h4>
                  <p>Free on-site consultation and project assessment</p>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6 mb-4">
                <div className="process-step text-center">
                  <div className="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    2
                  </div>
                  <h4>Planning</h4>
                  <p>Detailed planning and permit acquisition</p>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6 mb-4">
                <div className="process-step text-center">
                  <div className="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    3
                  </div>
                  <h4>Construction</h4>
                  <p>Professional construction with quality materials</p>
                </div>
              </div>
              
              <div className="col-lg-3 col-md-6 mb-4">
                <div className="process-step text-center">
                  <div className="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                    4
                  </div>
                  <h4>Completion</h4>
                  <p>Final inspection and warranty documentation</p>
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
                  Contact Sunrise Construction OBX today for a free consultation on any of our 
                  professional construction services. We're here to help protect and improve 
                  your Outer Banks property.
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

export default ServicesPage;