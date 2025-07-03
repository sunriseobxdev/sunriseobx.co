import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { register } from 'swiper/element/bundle';

import appData from '@data/app.json';
import { TitleContext } from '@common/title';
import ErrorBoundary from '@components/ErrorBoundary';
import DefaultSEO from '@components/SEO/DefaultSEO';
import StructuredData from '@components/SEO/StructuredData';

import '../styles/scss/style.scss';
import '../styles/globals.css';

// Register Swiper custom elements
register();

// Register Swiper custom elements
register();

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
        <DefaultSEO />
        <StructuredData />
        
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
          <link rel="dns-prefetch" href="//www.google-analytics.com" />
          <link rel="dns-prefetch" href="//googletagmanager.com" />
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
