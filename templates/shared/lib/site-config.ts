import { authConfig } from "./auth-config";

// All the copy and structure of the landing page lives in this one file.
// Everything below is placeholder text that only describes what this starter
// really does. EDIT it to describe your own product. The brand name comes from
// `appName` in lib/auth-config.ts.

export interface Link {
  label: string;
  href: string;
}

export const siteConfig = {
  appName: authConfig.appName,

  // Used for the page <title> and the social preview.
  tagline: "Accounts and sign-in, ready to go",
  description:
    "Create an account, verify your email and manage your sessions. Replace this description with what your product does.",

  // Anchor links in the navbar (they point at the section ids below).
  nav: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
  ] as Link[],

  hero: {
    eyebrow: "Starter template",
    title: "Your product starts with a solid sign-in",
    subtitle:
      "This landing page, the sign-in screens and the dashboard were generated for you. Edit lib/site-config.ts to describe what you are building.",
    primaryCta: { label: "Get started", href: "/signup" } as Link,
    secondaryCta: { label: "See what's included", href: "#features" } as Link,
  },

  // Shown in the features grid. `icon` is one of: shield, mail, key, refresh, lock, settings.
  features: [
    {
      icon: "shield",
      title: "Secure sessions",
      description: "Short-lived access tokens and rotating refresh tokens, kept in httpOnly cookies.",
    },
    {
      icon: "mail",
      title: "Email verification",
      description: "New accounts confirm their address with a single-use link sent by email.",
    },
    {
      icon: "key",
      title: "Password reset",
      description: "Reset links expire quickly, work once, and sign the account out everywhere.",
    },
    {
      icon: "refresh",
      title: "Stays signed in",
      description: "Sessions renew quietly in the background, so people are not logged out mid-task.",
    },
    {
      icon: "lock",
      title: "Brute-force protection",
      description: "Sign-in, sign-up and password routes are rate limited.",
    },
    {
      icon: "settings",
      title: "Account settings",
      description: "People can update their name, change their password, or sign out of every device.",
    },
  ] as { icon: string; title: string; description: string }[],

  steps: [
    { title: "Create an account", description: "Sign up with an email address and a password." },
    { title: "Verify your email", description: "Open the link we send to confirm the address is yours." },
    { title: "Use the dashboard", description: "Sign in to see your account and manage your settings." },
  ] as { title: string; description: string }[],

  faq: [
    {
      question: "How are passwords stored?",
      answer: "Passwords are hashed with bcrypt before they are saved. The hash is never sent to the browser.",
    },
    {
      question: "What if I forget my password?",
      answer: "Use the \"Forgot password?\" link on the sign-in page. We email a single-use reset link that expires after an hour.",
    },
    {
      question: "Can I sign out of all my devices?",
      answer: "Yes. Open Settings in the dashboard and choose \"Sign out everywhere\".",
    },
    {
      question: "Can I change the design?",
      answer: "Yes. Colours and corner radius are variables in styles/authforge.css, and the copy on this page is in lib/site-config.ts.",
    },
  ] as { question: string; answer: string }[],

  cta: {
    title: "Ready to get started?",
    subtitle: "Create your account in under a minute.",
    button: { label: "Create an account", href: "/signup" } as Link,
  },

  footer: {
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ] as Link[],
  },

  // Set to false to remove the small "Built with nextauthforge" line.
  showCredit: true,
};
