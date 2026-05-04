import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Got Watts — Client Dashboard",
  description: "Lead & revenue attribution dashboard by Micheletti Media",
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
