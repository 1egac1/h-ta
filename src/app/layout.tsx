import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Morrow — Your AI career companion', description: 'A more human way to find your next opportunity.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
