import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/Providers/ThemeProvider";

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/Providers/AuthProvider";

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
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
