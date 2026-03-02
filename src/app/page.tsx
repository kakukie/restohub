import LandingPage from '@/components/landing/LandingPage'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meenuin - Digital Menu & Restaurant POS',
  description: 'Berikan pengalaman bersantap yang tak terlupakan dengan menu digital interaktif. Kelola pesanan dengan mulus di berbagai perangkat.',
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingPage />
    </main>
  )
}
