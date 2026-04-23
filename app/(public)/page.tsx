import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { TrustBadges } from '@/components/landing/trust-badges'
import { Services } from '@/components/landing/services'
import { Pricing } from '@/components/landing/pricing'
import { HowItWorks } from '@/components/landing/how-it-works'
import { AboutUs } from '@/components/landing/about-us'
import { BeforeAfter } from '@/components/landing/before-after'
import { Testimonials } from '@/components/landing/testimonials'
import { FAQ } from '@/components/landing/faq'
import { CTASection } from '@/components/landing/cta-section'
import { ContactForm } from '@/components/landing/contact-form'
import { Footer } from '@/components/landing/footer'
import { WhatsIncluded } from '@/components/landing/whats-included'

export default function HomePage() {
    return (
        <>
            <main>
                <Hero />
                <TrustBadges />
                <Services />
                <Pricing />
                <HowItWorks />
                <WhatsIncluded />
                <AboutUs />
                <BeforeAfter />
                <Testimonials />
                <FAQ />
                <CTASection />
                <ContactForm />
            </main>
            <Footer />
        </>
    )
}
