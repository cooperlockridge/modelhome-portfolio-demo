import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ModelHome — A smaller space to explore what’s possible",
  description:
    "An independently rebuilt portfolio demo by Cooper Lockridge. Explore fictional homes, compare simulated pricing, and try a fictional referral.",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
