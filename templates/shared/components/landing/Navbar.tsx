import { BrandLogo } from "../auth/BrandLogo";
import { siteConfig } from "../../lib/site-config";
import { MobileMenu } from "./MobileMenu";
import { NavAuth } from "./NavAuth";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--af-border)] bg-[color:var(--af-nav-bg)] backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLogo />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {siteConfig.nav.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded text-sm font-medium text-[color:var(--af-muted)] hover:text-[color:var(--af-text)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <NavAuth />
          </div>
          <MobileMenu links={siteConfig.nav} />
        </div>
      </div>
    </header>
  );
}
