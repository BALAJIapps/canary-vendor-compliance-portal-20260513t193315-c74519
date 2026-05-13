import type { Metadata } from "next";
import { Toaster } from "@/components/providers/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "VendorShield — Vendor Compliance Portal",
  description: "Know every vendor before they touch your stack.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Ubuntu:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
