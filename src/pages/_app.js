import React from "react";
import Head from "next/head";
import appData from "@data/app.json";
import { NextSeo } from 'next-seo';
import { TitleContext } from "@common/title";

import '../styles/scss/style.scss';
import "../styles/globals.css";

import { register } from "swiper/element/bundle";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
// register Swiper custom elements
register();

const defaultImage = `${appData.settings.url}android-chrome-512x512.png`;

function MyApp({ Component, pageProps }) {
  return (
    <>
      <NextSeo
      title={appData.settings.siteName}
      description={appData.settings.description}
      canonical={appData.settings.url}
      openGraph={{
        url: appData.settings.url,
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
        siteName: appData.settings.siteName,
      }}
      twitter={{
        handle: '@sunriseobx',
        site: '@sunriseobx',
        cardType: 'summary_large_image'
      }}

    />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
