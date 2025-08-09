import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ActivityLog } from '@/components/activity-log';
import { ActivityLogWrapper } from '@/hooks/use-activity-log';
import { InfoHub } from '@/components/info-hub';
import { ExportHub } from '@/components/export-hub';

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-translator-teacher.firebaseapp.com'), // Important: Change to your production URL
  title: {
    default: 'المترجم الذكي | أ. أسامة العُمري',
    template: `%s | أ. أسامة العُمري`,
  },
  description: 'تطبيق ويب تعليمي يستخدم الذكاء الاصطناعي لتقديم تجربة تعلم غنية وتفاعلية للغة الإنجليزية للناطقين بالعربية، يشمل قاموسًا وتحليلًا شاملاً للدروس.',
  keywords: [
    'تعليم اللغة الإنجليزية',
    'قاموس عربي إنجليزي',
    'مترجم ذكي',
    'تحليل قواعد اللغة الإنجليزية',
    'تعلم الإنجليزية للعرب',
    'أسامة العمري',
    'AI educational tool',
    'learn English for Arabic speakers',
    'smart dictionary',
    'smart translator',
  ],
  authors: [{ name: 'أسامة محمد علي سعيد العُمري', url: 'https://wa.me/967711666863' }],
  creator: 'أسامة محمد علي سعيد العُمري',
  publisher: 'أسامة محمد علي سعيد العُمري',
  openGraph: {
    title: 'المترجم الذكي | أ. أسامة العُمري',
    description: 'رفيقك الذكي لتعلم اللغة الإنجليزية: قاموس، مترجم، ومعلم خاص يعمل بالذكاء الاصطناعي.',
    type: 'website',
    locale: 'ar_SA',
    url: 'https://ai-translator-teacher.firebaseapp.com', // Important: Change to your production URL
    siteName: 'المترجم الذكي',
    images: [
      {
        url: '/og-image.png', // Important: Create and add this image to the /public folder
        width: 1200,
        height: 630,
        alt: 'المترجم الذكي - أ. أسامة العُمري',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'المترجم الذكي | أ. أسامة العُمري',
    description: 'تطبيق تعليمي متطور للغة الإنجليزية للناطقين بالعربية، من تطوير أ. أسامة العُمري.',
    creator: '@your_twitter_handle', // Optional: Change to your Twitter handle
    images: ['/twitter-image.png'], // Important: Create and add this image to the /public folder
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  }
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="font-body antialiased">
        <ActivityLogWrapper>
          {children}
          <InfoHub />
          <ExportHub />
          <ActivityLog />
        </ActivityLogWrapper>
        <Toaster />
      </body>
    </html>
  );
}
