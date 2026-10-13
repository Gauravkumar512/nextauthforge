import Link from "next/link";
import { BrandLogo } from "../auth/BrandLogo";
import { siteConfig } from "../../lib/site-config";
import { cx, mutedText } from "../auth/ui";

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--af-border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <BrandLogo />
          <p className={cx(mutedText, "mt-2 text-sm")}>{siteConfig.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {siteConfig.footer.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-[color:var(--af-muted)] underline hover:text-[color:var(--af-text)]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={cx(mutedText, "mx-auto flex max-w-6xl flex-col gap-1 px-4 pb-8 text-xs sm:flex-row sm:justify-between sm:px-6")}>
        <p>&copy; {siteConfig.appName}</p>
        {siteConfig.showCredit ? (
          <p>
            Built with{" "}
            <a
              href="https://github.com/Gauravkumar512/nextauthforge"
              className="underline hover:text-[color:var(--af-text)]"
              target="_blank"
              rel="noopener noreferrer"
            >
              nextauthforge
            </a>
          </p>
        ) : null}
      </div>
    </footer>
  );
}
