import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Free Estimates",
  description:
    "Get a free construction estimate from Sunrise Construction. Roofing, siding, windows, and exterior renovation on the Outer Banks. Call (252) 619-7966.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
