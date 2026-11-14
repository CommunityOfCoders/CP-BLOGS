"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/contest", label: "Contest" },
  { href: "/arena", label: "Battle Arena" },
  { href: "/resources", label: "Resources" },
  { href: "/blogs", label: "Blogs" },
  { href: "/daily", label: "Daily Question" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setIsOpen(false), [pathname]);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <header className={`nav${scrolled || isOpen ? " nav--scrolled" : ""}`}>
      <div className="container nav__inner">
        <Link href="/" className="brand" aria-label="CP Club - home">
          <Image src="/images/cplogo2.png" width={34} height={34} alt="CP Club logo" />
          <span className="brand__meta">
            CP Club<em>VJTI · Mumbai</em>
          </span>
        </Link>

        <nav className="nav__links" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav__link${isActive(link.href) ? " is-active" : ""}`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          className="nav__burger"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isOpen && (
        <div className="nav__drawer">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav__drawer-link${isActive(link.href) ? " is-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
