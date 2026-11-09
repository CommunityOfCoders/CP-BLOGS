"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/contest", label: "Contest" },
    { href: "/resources", label: "Resources" },
    { href: "/blogs", label: "Blogs" },
  ];

  return (
    <>
      {/* Glass Panel Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo with Glowing Cursor Effect */}
            <Link
              href="/"
              className="flex items-center space-x-3 group"
            >
              <Image
                src="/images/cplogo2.png"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full ring-2 ring-matrix-200/20 group-hover:ring-matrix-200/60 transition-all duration-300"
                alt="CP Club Logo"
              />
              <div className="flex items-center">
                <span className="text-xl font-mono font-bold text-white group-hover:text-matrix-200 transition-colors duration-300">
                  CP Club
                </span>
                <span className="inline-block w-2 h-5 bg-matrix-200 ml-1 animate-pulse shadow-glow-lg" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-zinc-300 font-medium transition-all duration-300 hover:text-matrix-200 group"
                >
                  <span className="relative z-10">{link.label}</span>
                  <span className="absolute inset-0 bg-matrix-200/0 group-hover:bg-matrix-200/10 rounded-md transition-all duration-300" />
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-matrix-200 group-hover:w-3/4 transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg text-zinc-300 hover:text-matrix-200 hover:bg-matrix-200/10 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-over Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${isOpen ? "visible" : "invisible"
          }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={toggleMenu}
        />

        {/* Slide-over Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-64 glass-strong border-l border-white/10 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-lg font-mono font-bold text-matrix-200">
              Menu
            </span>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-zinc-300 hover:text-matrix-200 hover:bg-matrix-200/10 transition-all"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="p-4 space-y-2">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={toggleMenu}
                className="block px-4 py-3 rounded-lg text-zinc-300 font-medium hover:text-matrix-200 hover:bg-matrix-200/10 border border-transparent hover:border-matrix-200/20 transition-all duration-300 animate-slide-down"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <p className="text-xs text-zinc-500 text-center font-mono">
              CP CLUB 2026-27
            </p>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;