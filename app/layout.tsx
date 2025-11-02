import { cn } from "@/lib/utils";

import type { Metadata } from "next";
import "./globals.css";

import Providers from "@/providers/Providers";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses and income with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
