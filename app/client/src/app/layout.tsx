import type { Metadata } from "next";
import { Montserrat, Montserrat_Alternates } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const headline = Montserrat_Alternates({
  variable: "--font-headline",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const body = Montserrat({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const label = Montserrat({
  variable: "--font-label",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cuentas Claras",
  description: "Fundación visual de Cuentas Claras",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${headline.variable} ${body.variable} ${label.variable} theme-stitch`}>
      <body 
        className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-white"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(95, 77, 255, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(61, 59, 255, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 80% 10%, rgba(138, 43, 226, 0.1) 0%, transparent 35%)
          `,
          backgroundAttachment: "fixed"
        }}
      >
        {children}
        <Toaster position="top-center" closeButton />
      </body>
    </html>
  );
}
