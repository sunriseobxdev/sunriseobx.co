import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunrise Construction | Premier Outer Banks Construction Company",
  description:
    "Elite Outer Banks construction company specializing in hurricane-resistant homes, beachfront construction, Wincore windows, and fortified roofing. Serving OBX with 20+ years experience.",
  keywords:
    "Outer Banks construction, OBX builders, beachfront construction, hurricane resistant homes, Wincore windows, fortified roofing, coastal construction",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
