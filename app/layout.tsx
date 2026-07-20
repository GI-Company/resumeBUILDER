import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const SITE_URL = 'https://resume-builder-pi-coral.vercel.app';
const SITE_TITLE = 'Agent Rez AI — Free Resume Builder & ATS Templates';
const SITE_DESCRIPTION = 'Build professional, ATS-optimized resumes for free with Agent Rez AI. Features 6 premium templates, AI cover letter generator, and cloud saving.';

export const metadata: Metadata = {
  // ── Core SEO ──────────────────────────────────────────────
  title: {
    default: SITE_TITLE,
    template: '%s | Agent Rez AI',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'AI resume builder', 'free resume builder', 'ATS-optimized resume',
    'resume templates', 'AI cover letter generator', 'professional resume',
    'Agent Rez', 'career tools', 'resume PDF export', 'STAR bullet points',
  ],
  authors: [{ name: 'Agent Rez AI' }],
  creator: 'Agent Rez AI',

  // ── Canonical & Indexing ──────────────────────────────────
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Open Graph (Facebook, LinkedIn, etc.) ─────────────────
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Agent Rez AI',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },

  // ── X (Twitter) Cards ─────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },

  // ── Icons / Favicon ───────────────────────────────────────
  icons: {
    icon: '/icon.svg',
  },
};

// ── Organization Schema.org JSON-LD ───────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Agent Rez AI',
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  creator: {
    '@type': 'Organization',
    name: 'Agent Rez AI',
    url: SITE_URL,
  },
  featureList: [
    'AI-powered resume writing',
    'ATS-optimized resume templates',
    'AI cover letter generator',
    'LinkedIn and PDF resume import',
    'Conversational AI career agent',
    'Professional PDF export',
    'Cloud-based resume saving',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased">
        {children}
        <Toaster position="bottom-right" />
        
      </body>
    </html>
  );
}

