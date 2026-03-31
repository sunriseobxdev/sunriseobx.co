import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-navy-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/img/Sunrise-Logo-No-Text.svg" alt="Sunrise" width={28} height={28} />
              <span className="text-lg font-bold text-white">
                <span className="text-sunrise-500">Sunrise</span> Construction
              </span>
            </Link>
            <p className="text-navy-400 text-sm leading-relaxed">
              Premier Outer Banks construction company. Hurricane-resistant
              homes, beachfront construction, and coastal renovations with
              unmatched craftsmanship.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-4">
              Services
            </h4>
            <ul className="space-y-2">
              {[
                "Roof Replacements",
                "New Siding",
                "Window Replacement",
                "Exterior Construction",
                "FORTIFIED Roofing",
              ].map((s) => (
                <li key={s}>
                  <Link href="/services" className="text-sm text-navy-400 hover:text-white transition">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About Us" },
                { href: "/projects", label: "Projects" },
                { href: "/blog", label: "Blog" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-navy-400 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-navy-300 uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-navy-400">
              <li>5149-5177 N Croatan Hwy</li>
              <li>Kitty Hawk, NC 27949</li>
              <li className="pt-2">
                <a href="tel:+12526197966" className="hover:text-white transition">
                  (252) 619-7966
                </a>
              </li>
              <li>
                <a href="mailto:hello@sunriseobx.co" className="hover:text-white transition">
                  hello@sunriseobx.co
                </a>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a
                href="https://www.facebook.com/sunriseobx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-400 hover:text-white transition"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-navy-500 text-xs">
            &copy; {new Date().getFullYear()} Sunrise Construction Services LLC. All rights reserved.
          </p>
          <p className="text-navy-600 text-xs">
            Serving Nags Head, Duck, Kitty Hawk, Kill Devil Hills, Manteo, Hatteras &amp; all of OBX
          </p>
        </div>
      </div>
    </footer>
  );
}
