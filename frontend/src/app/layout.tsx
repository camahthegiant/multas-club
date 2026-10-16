import type { Metadata, Viewport } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { BalonBackdrop } from "@/components/BalonBackdrop";
import { CartaShieldDefs } from "@/components/CartaShieldDefs";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "Multas — Rugby Castelló",
  description: "Control de multas internas del equipo",
  manifest: "/manifest.json",
  robots: { index: false, follow: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full antialiased ${oswald.variable}`}>
      <body className="min-h-full">
        <ServiceWorkerRegister />
        <CartaShieldDefs />
        <BalonBackdrop />
        {children}
      </body>
    </html>
  );
}
