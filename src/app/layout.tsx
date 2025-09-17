import type { Metadata } from "next";
import { Geist, Geist_Mono, Dancing_Script, Great_Vibes, Parisienne } from "next/font/google";
import "./globals.css";
import ToastProvider from "../components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
});

const parisienne = Parisienne({
  variable: "--font-parisienne",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "MJ & Erica",
  description: "Join us in celebrating the love story of MJ and Erica",
  icons: {
    icon: [
      { url: "/imgs/circle-logo.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/imgs/circle-logo.png",
    shortcut: "/imgs/circle-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} ${greatVibes.variable} ${parisienne.variable} antialiased`}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
