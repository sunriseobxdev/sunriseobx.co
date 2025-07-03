import { DefaultSeo } from 'next-seo';

const DefaultSEO = () => {
  return (
    <DefaultSeo
      title="Sunrise Construction | Premier Outer Banks Construction Company | OBX Builders"
      description="Elite Outer Banks construction company specializing in hurricane-resistant homes, beachfront construction, Wincore windows, and fortified roofing. Serving OBX with 20+ years experience."
      canonical="https://sunriseobx.co"
      openGraph={{
        type: 'website',
        locale: 'en_US',
        url: 'https://sunriseobx.co',
        siteName: 'Sunrise Construction - Outer Banks Premier Builders',
        title: 'Sunrise Construction | Premier Outer Banks Construction Company',
        description: 'Elite Outer Banks construction company specializing in hurricane-resistant homes, beachfront construction, Wincore windows, and fortified roofing. Serving OBX with 20+ years experience.',
        images: [
          {
            url: 'https://sunriseobx.co/img/og-image.jpg',
            width: 1200,
            height: 630,
            alt: 'Sunrise Construction - Outer Banks Premier Construction Company',
          },
        ],
      }}
      twitter={{
        handle: '@SunriseOBX',
        site: '@SunriseOBX',
        cardType: 'summary_large_image',
      }}
      additionalMetaTags={[
        {
          name: 'keywords',
          content: 'Outer Banks construction, OBX builders, beachfront construction, hurricane resistant homes, Wincore windows, fortified roofing, coastal construction, Outer Banks contractors, OBX home builders, storm damage repair, beach house construction, Outer Banks NC construction company',
        },
        {
          name: 'author',
          content: 'Sunrise Construction',
        },
        {
          name: 'robots',
          content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        },
        {
          name: 'googlebot',
          content: 'index, follow',
        },
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
          content: '35.5582;-75.4665',
        },
        {
          name: 'ICBM',
          content: '35.5582, -75.4665',
        },
        {
          name: 'business:contact_data:locality',
          content: 'Outer Banks',
        },
        {
          name: 'business:contact_data:region',
          content: 'North Carolina',
        },
        {
          name: 'business:contact_data:country_name',
          content: 'United States',
        },
      ]}
      additionalLinkTags={[
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
      ]}
    />
  );
};

export default DefaultSEO;