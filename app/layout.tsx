import { cn } from "@/lib/utils";
import { Open_Sans } from "next/font/google";

import type { Metadata } from "next";
import "./globals.css";

import Providers from "@/providers/Providers";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses and income with ease",
};

const openSans = Open_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          `${openSans.className} min-h-screen bg-background antialiased`
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
