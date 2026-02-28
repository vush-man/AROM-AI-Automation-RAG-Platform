import { ArrowRight } from 'lucide-react'
import './CTABanner.css'

export default function CTABanner() {
    return (
        <section className="cta-banner">
            <div className="cta-banner__bg" />
            <div className="container cta-banner__content">
                <h2 className="text-h2">Let AI do the Work so You<br />Can Scale Faster.</h2>
                <p className="cta-banner__sub">
                    Book a free strategy call and see what AROM can automate for you.
                </p>
                <div className="cta-banner__actions">
                    <a href="#contact" className="btn-primary">
                        Book a free call <ArrowRight size={16} />
                    </a>
                    <a href="#services" className="btn-secondary">View Services</a>
                </div>
            </div>
        </section>
    )
}
