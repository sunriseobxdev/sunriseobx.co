import Data from "../../data/sections/about.json";
import Image from "next/image";

const AboutSection = () => {
    return (
      <section className="gap no-top about-style-one">
        <div className="container">
          <div className="row">
            <div className="col-lg-6" >
              <div className="about-data-left">
                <figure>
                  <Image src={Data.image1.url} alt={Data.image1.alt} width={500} height={400} />
                </figure>
                <figure className="about-image">
                  <Image src={Data.image2.url} alt={Data.image2.alt} width={400} height={300} />
                </figure>
              </div>
            </div>
            <div className="col-lg-6" >
              <div className="about-data-right">
                <span>{Data.subtitle}</span>
                <h2>{Data.title}</h2>
                <div className="about-info">
                  <p>
                    {Data.text}
                  </p>
                  <figure>
                    <Image className="light-icon" src={Data.signature.light} alt={Data.signature.alt} width={200} height={100} />
                    <Image className="dark-icon" src={Data.signature.dark} alt={Data.signature.alt} width={200} height={100} />
                  </figure>
                  <h3>{Data.name}</h3>
                  <h4>{Data.role}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
};

export default AboutSection;