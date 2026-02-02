import Header from '@/components/Headers/Header'
import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { Montserrat } from 'next/font/google'
import Providers from './Providers'
import AuthenticationModal from '@/components/auth'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] })

export const metadata: Metadata = {
  title: 'Find your perfect companion',
  description: 'Find your perfect companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <Providers>
          <Header />
          <AuthenticationModal />
          {children}
        </Providers>
      </body>
    </html>
  )
}
