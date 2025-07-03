
import Layouts from "@layouts/Layouts";

import PageBanner from "@components/PageBanner";
import CountersSection from "@components/sections/Counters";
import ServicesSection from "../components/sections/Services";
import Services2Section from "../components/sections/Services2";
import PartnersSlider from "../components/sliders/Partners";
import TestimonialSlider from "../components/sliders/Testimonial";

const About = () => {
  return (
    <Layouts>
      <PageBanner pageTitle={"About Us"} metaUrl="about" />
      
      {/* About-First Start */}
      <section className="gap about-first">
        <div className="container">
          <div className="row">
            <h2> The Outer Banks <br/> Premier Residental Exterior <br/> Construction  Service</h2>
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <div className="who-we-are">
                <div>
                  <h3>Who We Are?</h3>
                  <p>At Sunrise Construction, our mission is to redefine excellence in construction on the Outer Banks of North Carolina. Founded in 2023, we stand as a beacon of innovation and commitment, bridging the gap in the market for a medium-sized construction company that prioritizes exceptional craftsmanship, superior customer service, and transparent communication. Our dedicated team, at Sunrise Construction, is driven by a passion for delivering projects that not only meet but exceed our clients' expectations. With a focus on quality, integrity, and collaboration, we embark on every construction endeavor, ensuring that the structures we build not only withstand the test of time but become integral parts of the vibrant Outer Banks community.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-5 offset-lg-1">
              <div className="who-we-are space">
                <figure>
                  <img className="w-100" src="/img/about.jpg" alt="About Image Two" />
                </figure>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* About-First End */}

      {/* <CountersSection /> */}

      {/*About How It Works Start */}
      <section className="gap about-how-it-works light-bg-color">
        <div className="heading">
          <figure>
            <img src="/images/heading-icon.png" alt="Heading Icon" />
          </figure>
          <span>Plan + Control</span>
          <h2>Features</h2>
        </div>
        <div className="container">
          <div className="row g-0">
            <div className="col-lg-3 col-md-6 col-sm-12" >
              <div className="plans h-100">
                <div className="y-box d-flex-all">
                  1.
                </div>
                <h3>Free Consultation</h3>
                <p>We believe that an informed decision is the only decision you should make.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-12" >
              <div className="plans h-100">
                <div className="y-box d-flex-all">
                  2.
                </div>
                <h3>Frequent Progress Reports</h3>
                <p>Communication is the key ensure success, we will actively update you about your project.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-12" >
              <div className="plans h-100">
                <div className="y-box d-flex-all">
                  3.
                </div>
                <h3>Licensed and Insured</h3>
                <p>Experiance peace of mind with qualified and certified professionals.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-12" >
              <div className="plans h-100">
                <div className="y-box d-flex-all">
                  4.
                </div>
                <h3>Competitive Pricing</h3>
                <p>We are builders, not salesmen, you will always recieve a fair quote for your projects.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*About How It Works End */}

      <Services2Section />

      {/*About Key Benefits Start */}
      <section className="gap about-key-benefits">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6" >
              <div className="data">
                <figure>
                  <img className="w-100" src="/img/WhyChooseUs.jpg" alt="About key Benefits" />
                </figure>
              </div>
            </div>
            <div className="col-lg-6" >
              <div className="data">
                <h2>Why Choose Us?</h2>
                <ul>
                  <li>
                    <i className="fa-solid fa-check" />
                    <p>Protect yourself from material liens with no revolving credit accounts.</p>
                  </li>
                  <li>
                    <i className="fa-solid fa-check" />
                    <p>Enjoy a seamless experience with a dedicated on-site project manager</p>
                  </li>
                  <li>
                    <i className="fa-solid fa-check" />
                    <p>Make informed decisions without high-pressure sales tactics.</p>
                  </li>
                  <li>
                    <i className="fa-solid fa-check" />
                    <p>Benefit from our owner-managed approach, delivering exceptional results.</p>
                  </li>
                  <li>
                    <i className="fa-solid fa-check" />
                    <p>Receive unmatched service and craftsmanship</p>
                  </li>
                  <li>
                    <i className="fa-solid fa-check" />
                    <p>Prioritize craftsmanship with our team of contractors, not salesmen.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*About Key Benefits End */}

      <TestimonialSlider />

      <PartnersSlider />
      
    </Layouts>
  );
};

export default About;
