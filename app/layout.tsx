import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "DigiWeek '26 — UCC & DA",
  description: "DigiWeek '26 — an immersive technology experience at J.C. Bose University.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
