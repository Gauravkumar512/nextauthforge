import type { Metadata } from "next";
import { Af } from "../components/auth/Af";
import { Faq } from "../components/landing/Faq";
import { Features } from "../components/landing/Features";
import { FinalCta } from "../components/landing/FinalCta";
import { Footer } from "../components/landing/Footer";
import { Hero } from "../components/landing/Hero";
import { Navbar } from "../components/landing/Navbar";
import { ProductPreview } from "../components/landing/ProductPreview";
import { Steps } from "../components/landing/Steps";
import { siteConfig } from "../lib/site-config";

// Page-level metadata only: your root layout's metadata is left alone.
export const metadata: Metadata = {
  title: `${siteConfig.appName}: ${siteConfig.tagline}`,
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.appName}: ${siteConfig.tagline}`,
    description: siteConfig.description,
    type: "website",
    siteName: siteConfig.appName,
  },
};

// Static page: no database or session access. All copy is in lib/site-config.ts.
export default function LandingPage() {
  return (
    <Af className="flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Steps />
        <ProductPreview />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </Af>
  );
}
