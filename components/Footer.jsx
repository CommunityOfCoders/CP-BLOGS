import React from "react";
import Link from "next/link";
import { Github, MessageSquare } from "lucide-react";

const quickLinks = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/contest", label: "Contests" },
  { href: "/arena", label: "Battle Arena" },
  { href: "/resources", label: "Resources" },
  { href: "/blogs", label: "Blogs" },
  { href: "/daily", label: "Daily Question" },
];

const socialLinks = [
  { href: "https://github.com/Amal-Verma/COC-CP-CLUB-Practice-Questions", label: "GitHub", icon: Github },
  { href: "https://chat.whatsapp.com/ITzWAJLkazz0XIJDZ5BZpv", label: "Community Chat", icon: MessageSquare },
];

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer__top">
        <div>
          <span className="footer__wordmark">
            CP Club
            <br />
            at VJTI<span className="footer__dot">.</span>
          </span>
          <p className="footer__tag">
            Competitive programming, problem-solving and algorithmic thinking, built by Community of Coders.
          </p>
        </div>

        <div className="footer__cols">
          <div className="footer__col">
            <span className="footer__col-title">Explore</span>
            {quickLinks.map((l) => (
              <Link key={l.href} href={l.href} className="footer__link">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="footer__col">
            <span className="footer__col-title">Connect</span>
            {socialLinks.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="footer__link">
                {l.label}
              </a>
            ))}
            <a href="https://github.com/CommunityOfCoders" target="_blank" rel="noopener noreferrer" className="footer__link">
              Community of Coders
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <span>© 2026-27 CP Club, VJTI.</span>
        <div className="footer__socials">
          {socialLinks.map((l) => {
            const Icon = l.icon;
            return (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="footer__social" aria-label={l.label}>
                <Icon />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
