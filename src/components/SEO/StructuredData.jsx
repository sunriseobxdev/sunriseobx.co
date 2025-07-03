import Head from 'next/head';

const StructuredData = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "name": "Sunrise Construction",
    "alternateName": "Sunrise Construction OBX",
    "description": "Premier Outer Banks construction company specializing in hurricane-resistant homes, beachfront construction, Wincore windows, and fortified roofing services.",
    "url": "https://sunriseobx.co",
    "logo": "https://sunriseobx.co/img/logo.png",
    "image": "https://sunriseobx.co/img/og-image.jpg",
    "telephone": "+1-252-555-0123",
    "email": "info@sunriseobx.co",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Outer Banks",
      "addressRegion": "NC",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "35.5582",
      "longitude": "-75.4665"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Outer Banks",
        "sameAs": "https://en.wikipedia.org/wiki/Outer_Banks"
      },
      {
        "@type": "City", 
        "name": "Nags Head"
      },
      {
        "@type": "City",
        "name": "Duck"
      },
      {
        "@type": "City",
        "name": "Kitty Hawk"
      },
      {
        "@type": "City",
        "name": "Kill Devil Hills"
      },
      {
        "@type": "City",
        "name": "Manteo"
      },
      {
        "@type": "City",
        "name": "Hatteras"
      }
    ],
    "serviceType": [
      "Hurricane-resistant construction",
      "Beachfront home construction", 
      "Wincore window installation",
      "Fortified roofing",
      "Coastal exterior construction",
      "Storm damage repair",
      "Beach house renovation"
    ],
    "foundingDate": "2003",
    "founder": {
      "@type": "Person",
      "name": "Zachary Wayland"
    },
    "employee": {
      "@type": "Person",
      "name": "Zachary Wayland",
      "jobTitle": "Director"
    },
    "sameAs": [
      "https://www.facebook.com/SunriseConstructionOBX",
      "https://www.instagram.com/sunriseobx",
      "https://www.linkedin.com/company/sunrise-construction-obx"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Construction Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Wincore Windows Installation",
            "description": "Professional Wincore window installation for hurricane protection in Outer Banks homes"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Fortified Roofing",
            "description": "IBHS Fortified roofing systems for hurricane protection in coastal North Carolina"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Coastal Exterior Construction",
            "description": "Complete exterior construction services for Outer Banks beachfront properties"
          }
        }
      ]
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://sunriseobx.co/#organization",
    "name": "Sunrise Construction",
    "image": "https://sunriseobx.co/img/og-image.jpg",
    "telephone": "+1-252-555-0123",
    "email": "info@sunriseobx.co",
    "url": "https://sunriseobx.co",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Outer Banks",
      "addressRegion": "NC", 
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "35.5582",
      "longitude": "-75.4665"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "07:00",
        "closes": "17:00"
      },
      {
        "@type": "OpeningHoursSpecification", 
        "dayOfWeek": "Saturday",
        "opens": "08:00",
        "closes": "16:00"
      }
    ],
    "priceRange": "$$$"
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
    </Head>
  );
};

export default StructuredData;