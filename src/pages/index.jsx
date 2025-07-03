import React from "react";
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