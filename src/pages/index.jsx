import React from "react";
import { NextSeo } from 'next-seo';
import Layouts from "@layouts/Layouts";

import { getSortedPostsData } from "@library/posts";
import { getSortedProjectsData } from "@library/projects";

import Hero3Section from "@components/sections/Hero3";
import About3Section from "@components/sections/About3";
import CallToActionSection from "@components/sections/CallToAction";
import ContactFormSection from "@components/sections/ContactForm";
import PartnersSlider from "../components/sliders/Partners";
import ProjectsSlider from "../components/sliders/Projects";

const Home3 = (props) => {
  return (
    <>
      <NextSeo
        title="Sunrise Construction | Premier Outer Banks Construction Company | OBX Builders"
        description="Elite Outer Banks construction company specializing in hurricane-resistant homes, beachfront construction, Wincore windows, and fortified roofing. Serving OBX with 20+ years experience."
        canonical="https://sunriseobx.co"
        openGraph={{
          url: 'https://sunriseobx.co',
          title: 'Sunrise Construction | Premier Outer Banks Construction Company',
          description: 'Elite Outer Banks construction company specializing in hurricane-resistant homes, beachfront construction, Wincore windows, and fortified roofing. Serving OBX with 20+ years experience.',
          images: [
            {
              url: 'https://sunriseobx.co/img/og-image.jpg',
              width: 1200,
              height: 630,
              alt: 'Sunrise Construction - Outer Banks Premier Construction Company',
            }
          ],
          site_name: 'Sunrise Construction - Outer Banks',
        }}
        additionalMetaTags={[
          {
            name: 'keywords',
            content: 'Outer Banks construction company, OBX builders, beachfront construction, hurricane resistant homes, Wincore windows Outer Banks, fortified roofing OBX, coastal construction specialists, Outer Banks contractors, OBX home builders, storm damage repair Outer Banks, beach house construction, hurricane proof construction Outer Banks NC',
          },
          {
            name: 'geo.region',
            content: 'US-NC',
          },
          {
            name: 'geo.placename',
            content: 'Outer Banks, North Carolina',
          },
        ]}
      />
      <Layouts contactButton>
        <>
          <Hero3Section />
          <About3Section />
          <CallToActionSection />
          <ProjectsSlider projects={props.projects} />
          <PartnersSlider />
          <ContactFormSection />
        </>
      </Layouts>
    </>
  );
};

export default Home3;

export async function getStaticProps() {
  const allPosts = getSortedPostsData();
  const allProjects = getSortedProjectsData();

  return {
    props: {
      posts: allPosts,
      projects: allProjects
    }
  }
}