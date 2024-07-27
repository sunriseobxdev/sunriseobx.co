import Head from 'next/head';
import Link from "next/link";
import appData from "@data/app.json";
import { NextSeo } from 'next-seo';

const PageBanner = ({ pageTitle, pageDesc, pageImage }) => {
  const styles = {
    "parallax": {
      "backgroundImage": "url(/images/pattren-3.png)"
    }
  }
  const headTitle = `${appData.settings.siteName} - ${pageTitle}`;

  return (
    <>
            <NextSeo
      title={headTitle}
      description={appData.settings.description}
      canonical={appData.settings.url}
      openGraph={{
        url: appData.settings.url,
        title: appData.settings.siteName,
        description: appData.settings.description,
        images: [
          {
            url: pageTitle ? appData.settings.url.replace(/\/$/, '') + pageImage : appData.settings.url + 'android-chrome-512x512.png',
            width: 512,
            height: 512,
            alt: appData.settings.siteName,
            type: 'image/png',
          },
        ],
        siteName: appData.settings.siteName,
      }}
      twitter={{
        handle: '@sunriseobx',
        site: '@sunriseobx',
        cardType: 'summary_large_image'
      }}
    />
      <section className="banner-style-one">
        <div className="parallax" style={styles.parallax} />

        <div className="container">
          <div className="row">
            <div className="banner-details">
              <h2>{pageTitle}</h2>
              <p>{pageDesc}</p>
            </div>
          </div>
        </div>
        <div className="breadcrums">
          <div className="container">
            <div className="row">
              <ul>
                <li>
                  <Link href="/">
                    <i className="fa-solid fa-house"></i>
                    <p>Home</p>
                  </Link>
                </li>
                <li className="current">
                  <p>{pageTitle}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default PageBanner;
