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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${headline.variable} ${body.variable} ${label.variable}`}>
      <body>
        {children}
        <Toaster position="top-center" closeButton />
      </body>
    </html>
  );
}
