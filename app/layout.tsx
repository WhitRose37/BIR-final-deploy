import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import ClientLayout from "./layout-client";

export const metadata: Metadata = {
  title: "BIR Part Generator",
  description: "Generate and manage manufacturing parts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
