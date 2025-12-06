import { cn } from "@/lib/utils";
import { Open_Sans } from "next/font/google";

import type { Metadata } from "next";
import "./globals.css";

import Providers from "@/providers/Providers";
import Head from "next/head";

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
      <Head>
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="favicon-32x32.png"
        />
      </Head>
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
