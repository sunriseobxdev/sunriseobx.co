import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Sunrise Construction — the Outer Banks' premier construction company. Founded with a mission to redefine excellence in coastal construction.",
};

const stats = [
  { value: "20+", label: "Years of Experience" },
  { value: "500+", label: "Projects Completed" },
  { value: "50+", label: "5-Star Reviews" },
  { value: "100%", label: "Licensed & Insured" },
];

const values = [
  {
    title: "Uncompromising Craftsmanship",
    description:
      "Every nail, every shingle, every window — we treat your home like our own. Our crews are trained, certified, and take pride in delivering work that lasts decades.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
      </svg>
    ),
  },
  {
    title: "Radical Transparency",
    description:
      "No surprises, no hidden fees, no runaround. We give you honest assessments, detailed estimates, and keep you informed at every stage of your project.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Coastal Innovation",
    description:
      "We stay at the forefront of building science — from FORTIFIED roofing to Low-E energy products — because the Outer Banks demands more than mainland solutions.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Community First",
    description:
      "The Outer Banks isn't just where we work — it's home. We're invested in building a more resilient OBX for the families, businesses, and visitors who love it here.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
];

const team = [
  { name: "Zachary Wayland", role: "President & CEO", image: "https://cdn.sunriseobx.co/img/site/zach-full.jpg" },
];

export default function AboutPage() {
  return (
    <main className="overflow-hidden">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pb-28 bg-navy-900">
        <div className="absolute inset-0 opacity-15">
          <img src="https://cdn.sunriseobx.co/img/site/company.jpeg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <p className="text-sunrise-400 font-semibold text-sm tracking-widest uppercase mb-4">
            About Us
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Building Trust on the
            <br />
            <span className="text-sunrise-400">Outer Banks</span>
          </h1>
          <p className="mt-6 text-xl text-navy-300 max-w-2xl">
            Redefining excellence in coastal construction since 2003.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <p className="text-sunrise-600 font-semibold text-sm tracking-widest uppercase mb-3">
                Our Story
              </p>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-900 leading-tight">
                Born from a Passion for
                <br />
                Coastal Building
              </h2>
              <div className="mt-8 space-y-5 text-navy-600 text-lg leading-relaxed">
                <p>
                  Sunrise Construction was founded with a clear mission: bring
                  exceptional craftsmanship, transparent communication, and
                  genuine care to every project on the Outer Banks.
                </p>
                <p>
                  We saw a gap in the market — homeowners deserved a construction
                  company that understood the unique demands of coastal building
                  and delivered on every promise. That&apos;s exactly what we set
                  out to be.
                </p>
                <p>
                  Today, as Certified CertainTeed ShingleMasters, authorized
                  Wincore Windows dealers, and IBHS FORTIFIED evaluators, we
                  bring industry-leading products and certifications to every
                  home we touch. From Corolla to Hatteras, Sunrise is the name
                  OBX homeowners trust.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 mt-8 bg-sunrise-600 hover:bg-sunrise-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-sunrise-600/25"
              >
                Start a Conversation
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="relative">
              <img
                src="https://cdn.sunriseobx.co/img/site/about.jpg"
                alt="Sunrise Construction crew on an Outer Banks jobsite"
                className="rounded-2xl shadow-2xl w-full h-[550px] object-cover"
              />
              <div className="absolute -bottom-8 -right-4 lg:-right-8 bg-white p-6 rounded-2xl shadow-xl border border-navy-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sunrise-100 rounded-xl flex items-center justify-center">
                    <Image src="https://cdn.sunriseobx.co/img/site/slider/fortified.png" alt="FORTIFIED" width={32} height={32} />
                  </div>
                  <div>
                    <p className="font-bold text-navy-900">IBHS FORTIFIED</p>
                    <p className="text-sm text-navy-400">Certified Builder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-navy-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-5xl lg:text-6xl font-extrabold text-sunrise-400">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm text-navy-300 font-medium tracking-wide uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 lg:py-32 bg-navy-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sunrise-600 font-semibold text-sm tracking-widest uppercase mb-3">
              What Drives Us
            </p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-900">
              Our Core Values
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl p-8 border border-navy-100 hover:border-sunrise-200 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-sunrise-100 text-sunrise-600 flex items-center justify-center mb-5 group-hover:bg-sunrise-600 group-hover:text-white transition-colors">
                  {v.icon}
                </div>
                <h3 className="text-xl font-bold text-navy-900">{v.title}</h3>
                <p className="mt-3 text-navy-500 leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sunrise-600 font-semibold text-sm tracking-widest uppercase mb-3">
              Leadership
            </p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-900">
              Meet Our Team
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {team.map((member) => (
              <div key={member.name} className="text-center group">
                <div className="w-56 h-72 mx-auto rounded-2xl overflow-hidden mb-5 shadow-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-lg font-bold text-navy-900">{member.name}</h3>
                <p className="text-sm text-sunrise-600 font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0">
          <img src="https://cdn.sunriseobx.co/img/site/Beach-houses-1500.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-900/85" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <p className="text-sunrise-400 font-semibold text-sm tracking-widest uppercase mb-3">
            Where We Work
          </p>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Serving the Entire Outer Banks
          </h2>
          <p className="text-navy-300 max-w-2xl mx-auto mb-10 text-lg">
            From the northern beaches of Corolla to the southern shores of
            Hatteras, we&apos;re proud to serve the OBX community.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Corolla", "Duck", "Southern Shores", "Kitty Hawk",
              "Kill Devil Hills", "Nags Head", "Manteo", "Wanchese",
              "Rodanthe", "Waves", "Salvo", "Avon", "Buxton",
              "Frisco", "Hatteras",
            ].map((town) => (
              <span
                key={town}
                className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/10 hover:bg-sunrise-600 hover:border-sunrise-600 transition-all cursor-default"
              >
                {town}
              </span>
            ))}
          </div>
          <Link
            href="/contact"
            className="inline-block mt-12 bg-sunrise-600 hover:bg-sunrise-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-sunrise-600/25"
          >
            Get Your Free Estimate
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
