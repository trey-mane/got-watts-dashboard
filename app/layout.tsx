import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Micheletti Media — Client Portal",
  description: "Client portal by Micheletti Media",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-surface text-text-primary min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
