import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const font = Space_Grotesk({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Product Listing Analysis",
  description: "React frontend with a Python backend on Vercel."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
