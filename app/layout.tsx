import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "702ManyCards | Trading Card Singles",
    template: "%s | 702ManyCards",
  },
  description:
    "Premium Yu-Gi-Oh!, Pokemon & MTG trading card singles from a trusted collector. Browse, search, and buy cards at competitive prices with free shipping on orders $25+.",
  keywords: ["Yu-Gi-Oh", "Pokemon", "MTG", "trading cards", "TCG", "singles", "buy cards"],
  openGraph: {
    title: "702ManyCards | Trading Card Singles",
    description: "Premium Yu-Gi-Oh!, Pokemon & MTG singles from a trusted collector. Every card inspected, graded, and shipped with care.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "702 Many Cards" }],
    type: "website",
    siteName: "702ManyCards",
  },
  twitter: {
    card: "summary_large_image",
    title: "702ManyCards | Trading Card Singles",
    description: "Premium Yu-Gi-Oh!, Pokemon & MTG singles from a trusted collector.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.ygoprodeck.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('702mc_theme') ||
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
