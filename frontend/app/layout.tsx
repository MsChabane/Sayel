import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'استبيان العملاء | خدماتنا المهنية',
  description: 'أجب على أسئلة بسيطة حول مشروعك وسنتواصل معك بأفضل الحلول',
  openGraph: {
    title: 'استبيان العملاء',
    description: 'أخبرنا عن مشروعك من خلال محادثة بسيطة',
    locale: 'ar_SA',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-cairo antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster
            position="top-center"
            richColors
            duration={2000}
            toastOptions={{
              style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
            }}
          />
        </ThemeProvider>

        {/* Ad Script */}
        <Script
          id="aclib"
          src="//acscdn.com/script/aclib.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
