import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextSeo, DefaultSeo } from 'next-seo';
import { register } from 'swiper/element/bundle';

import appData from '@data/app.json';
import { TitleContext } from '@common/title';
import ErrorBoundary from '@components/ErrorBoundary';

import '../styles/scss/style.scss';
import '../styles/globals.css';

// Register Swiper custom elements
register();

const defaultImage = `${appData.settings.url}android-chrome-512x512.png`;

// Default SEO configuration
const defaultSEO = {
  title: appData.settings.siteName,
  description: appData.settings.description,
  canonical: appData.settings.url,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appData.settings.url,
    site_name: appData.settings.siteName,
    title: appData.settings.siteName,
    description: appData.settings.description,
    images: [
      {
        url: defaultImage,
        width: 512,
        height: 512,
        alt: appData.settings.siteName,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    handle: '@sunriseobx',
    site: '@sunriseobx',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'theme-color',
      content: '#ffffff',
    },
    {
      name: 'msapplication-TileColor',
      content: '#da532c',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'default',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  ],
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Handle route change loading states
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Handle client-side hydration
  useEffect(() => {
    // Remove server-side injected CSS if any
    const jssStyles = document.querySelector('#jss-server-side');

    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }

    // Initialize any client-side only features
    if (typeof window !== 'undefined') {
      // Performance monitoring
      if ('performance' in window && 'measure' in window.performance) {
        window.performance.mark('app-hydrated');
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <TitleContext.Provider value={appData.settings.siteName}>
        <DefaultSeo {...defaultSEO} />
        
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {/* Preload critical resources */}
          <link
            rel="preload"
            href="/css/bootstrap.min.css"
            as="style"
            onLoad="this.onload=null;this.rel='stylesheet'"
          />
          <link
            rel="preload"
            href="/css/fontawesome.min.css"
            as="style"
            onLoad="this.onload=null;this.rel='stylesheet'"
          />
          
          {/* DNS prefetch for external domains */}
          <link rel="dns-prefetch" href="//fonts.googleapis.com" />
          <link rel="dns-prefetch" href="//formspree.io" />
          
          {/* Structured data for business */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'LocalBusiness',
                name: appData.settings.siteName,
                description: appData.settings.description,
                url: appData.settings.url,
                telephone: appData.footer.info.tel,
                email: appData.footer.info.email,
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: appData.footer.info.address,
                  addressLocality: 'Kitty Hawk',
                  addressRegion: 'NC',
                  postalCode: '27949',
                  addressCountry: 'US',
                },
                sameAs: appData.social.map(social => social.link),
                serviceArea: {
                  '@type': 'GeoCircle',
                  geoMidpoint: {
                    '@type': 'GeoCoordinates',
                    latitude: 36.1063,
                    longitude: -75.7135,
                  },
                  geoRadius: '50000', // 50km radius
                },
              }),
            }}
          />
        </Head>

        {/* Loading indicator */}
        {isLoading && (
          <div className="route-loading">
            <div className="loading-spinner" />
          </div>
        )}

        <Component {...pageProps} />
      </TitleContext.Provider>
    </ErrorBoundary>
  );
}

export default MyApp;
