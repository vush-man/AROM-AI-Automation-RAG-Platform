import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import Services from '../components/landing/Services'
import Process from '../components/landing/Process'
import CaseStudies from '../components/landing/CaseStudies'
import Benefits from '../components/landing/Benefits'
import Pricing from '../components/landing/Pricing'
import Testimonials from '../components/landing/Testimonials'
import FAQ from '../components/landing/FAQ'
import CTABanner from '../components/landing/CTABanner'
import Footer from '../components/landing/Footer'
import RevealSection from '../components/ui/RevealSection'
import { Vortex } from "../components/ui/Vortex"

export default function LandingPage() {
    return (
        <>
            <Vortex
                backgroundColor="black"
                particleCount={700}
                baseHue={220}
                containerClassName="fixed inset-0 w-full h-full"
                className="relative z-10 w-full min-h-screen overflow-y-auto"
            >
                <Navbar />
                <Hero />
                <RevealSection><Services /></RevealSection>
                <RevealSection><Process /></RevealSection>
                <RevealSection><CaseStudies /></RevealSection>
                <RevealSection><Benefits /></RevealSection>
                <RevealSection><Pricing /></RevealSection>
                <RevealSection><Testimonials /></RevealSection>
                <RevealSection><FAQ /></RevealSection>
                <RevealSection><CTABanner /></RevealSection>
                <Footer />
            </Vortex>
        </>
    )
}



