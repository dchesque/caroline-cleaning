import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { TrustBadges } from '@/components/landing/trust-badges'
import { Services } from '@/components/landing/services'
import { HowItWorks } from '@/components/landing/how-it-works'
import { AboutUs } from '@/components/landing/about-us'
import { Testimonials } from '@/components/landing/testimonials'
import { FAQ } from '@/components/landing/faq'
import { CTASection } from '@/components/landing/cta-section'
import { Footer } from '@/components/landing/footer'

export default function HomePage() {
    return (
        <>
            <Header />
            <main>
                <Hero />
                <TrustBadges />
                <Services />
                <HowItWorks />
                <AboutUs />
                <Testimonials />
                <FAQ />
                <CTASection />
            </main>
            <Footer />
        </>
    )
}
