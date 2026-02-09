import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ForaTask - Smart Task Management for Teams',
  description: 'ForaTask is a powerful multi-tenant task management platform designed for teams. Streamline workflows, track progress, and boost productivity with our intuitive solution.',
  keywords: 'task management, team collaboration, project management, productivity, workflow automation',
  authors: [{ name: 'ForaTask' }],
  openGraph: {
    title: 'ForaTask - Smart Task Management for Teams',
    description: 'Streamline your team\'s workflow with ForaTask. Powerful task management, real-time collaboration, and smart automation.',
    url: 'https://foratask.com',
    siteName: 'ForaTask',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ForaTask - Smart Task Management for Teams',
    description: 'Streamline your team\'s workflow with ForaTask',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://foratask.com" />
        <meta name="theme-color" content="#0f172a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "ForaTask",
              "description": "Multi-tenant task management platform for teams",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web, iOS, Android",
              "offers": {
                "@type": "Offer",
                "price": "249",
                "priceCurrency": "INR",
                "priceValidUntil": "2027-12-31"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} bg-dark-950 text-white antialiased`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
