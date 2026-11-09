import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'FormTraceker — Affiliate Tracking',description:'Track affiliate clicks, leads, sub IDs and conversions.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang='en'><body>{children}</body></html>;}
