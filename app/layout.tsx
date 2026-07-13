import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'MYresume',
  description: 'A customizable resume builder',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" />
        <SpeedInsights />
      </body>
    </html>
  );
}

