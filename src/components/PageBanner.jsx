import { useMemo } from 'react';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import appData from '@data/app.json';

const PageBanner = ({
  pageTitle,
  pageDesc,
  pageImage,
  metaDescription,
  metaUrl,
  breadcrumbs = [],
  className = '',
}) => {
  // Memoize computed values for better performance
  const seoData = useMemo(() => {
    const headTitle = pageTitle
      ? `${pageTitle} | ${appData.settings.siteName}`
      : appData.settings.siteName;
    
    const description = metaDescription || pageDesc || appData.settings.description;
    const canonicalUrl = metaUrl
      ? `${appData.settings.url.replace(/\/$/, '')}${metaUrl}`
      : appData.settings.url;
    
    const imageUrl = pageImage
      ? `${appData.settings.url.replace(/\/$/, '')}${pageImage}`
      : `${appData.settings.url}android-chrome-512x512.png`;

    return {
      title: headTitle,
      description,
      canonical: canonicalUrl,
      openGraph: {
        url: canonicalUrl,
        type: 'website',
        title: headTitle,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: pageTitle || appData.settings.siteName,
            type: 'image/png',
          },
        ],
        siteName: appData.settings.siteName,
      },
      twitter: {
        handle: '@sunriseobx',
        site: '@sunriseobx',
        cardType: 'summary_large_image',
      },
    };
  }, [pageTitle, pageDesc, pageImage, metaDescription, metaUrl]);

  // Generate breadcrumb schema
  const breadcrumbSchema = useMemo(() => {
    const items = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: appData.settings.url,
      },
    ];

    if (breadcrumbs.length > 0) {
      breadcrumbs.forEach((crumb, index) => {
        items.push({
          '@type': 'ListItem',
          position: index + 2,
          name: crumb.name,
          item: crumb.url ? `${appData.settings.url.replace(/\/$/, '')}${crumb.url}` : undefined,
        });
      });
    } else if (pageTitle) {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: pageTitle,
      });
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    };
  }, [breadcrumbs, pageTitle]);

  const parallaxStyle = {
    backgroundImage: 'url(/images/pattren-3.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <>
      <NextSeo
        {...seoData}
        additionalMetaTags={[
          {
            name: 'robots',
            content: 'index,follow',
          },
          {
            property: 'article:author',
            content: appData.settings.siteName,
          },
        ]}
      />

      {/* Structured data for breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <section className={`banner-style-one ${className}`}>
        <div
          className="parallax"
          style={parallaxStyle}
          role="img"
          aria-label="Page banner background"
        />

        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="banner-details">
                <h1 className="banner-title">{pageTitle}</h1>
                {pageDesc && (
                  <p className="banner-description">{pageDesc}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="breadcrums" aria-label="Breadcrumb navigation">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <ol className="breadcrumb-list">
                  <li className="breadcrumb-item">
                    <Link href="/" aria-label="Go to homepage">
                      <i className="fa-solid fa-house" aria-hidden="true" />
                      <span>Home</span>
                    </Link>
                  </li>
                  
                  {breadcrumbs.length > 0 ? (
                    breadcrumbs.map((crumb, index) => (
                      <li
                        key={index}
                        className={`breadcrumb-item ${
                          index === breadcrumbs.length - 1 ? 'current' : ''
                        }`}
                      >
                        {crumb.url && index !== breadcrumbs.length - 1 ? (
                          <Link href={crumb.url}>
                            <span>{crumb.name}</span>
                          </Link>
                        ) : (
                          <span>{crumb.name}</span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="breadcrumb-item current">
                      <span>{pageTitle}</span>
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </nav>
      </section>
    </>
  );
};

export default PageBanner;
