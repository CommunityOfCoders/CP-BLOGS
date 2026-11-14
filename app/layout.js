import "./globals.css";
import "katex/dist/katex.min.css";
import NextTopLoader from "nextjs-toploader";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FluxLines from "@/components/FluxLines";

export const metadata = {
  title: "CP Club · VJTI",
  description: "Competitive Programming Club at VJTI, by Community of Coders.",
};

export const viewport = { themeColor: "#0A0A0A" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&f[]=switzer@400,500,600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="antialiased">
        <div className="site-flux-bg" aria-hidden="true">
          <FluxLines />
        </div>
        <div className="shell">
          <Navbar />
          <NextTopLoader color="#1DB954" showSpinner={false} />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
