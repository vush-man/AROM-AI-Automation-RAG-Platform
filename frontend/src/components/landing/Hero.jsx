import { ArrowRight, ArrowDown } from 'lucide-react'
import './Hero.css'

export default function Hero() {
    return (
        <section className="hero">
            <div className="hero__bg" />
            <div className="hero__content container">
                <span className="section-label" style={{ animationDelay: '0ms' }}>
                    NEW · AI-POWERED AUTOMATION
                </span>

                <h1 className="text-hero hero__title">
                    Intelligent Automation<br />
                    for Modern Businesses.
                </h1>

                <p className="hero__subtitle">
                    AROM brings AI automation to your workflows — streamlining
                    operations, transforming raw data, and powering growth.
                </p>

                <div className="hero__cta-row">
                    <a href="#contact" className="btn-primary">
                        Get in touch <ArrowRight size={18} />
                    </a>
                    <a href="#services" className="btn-secondary">
                        View services <ArrowDown size={18} />
                    </a>
                </div>

                <div className="hero__social-proof">
                    <div className="hero__avatars">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="hero__avatar" style={{ '--i': i }}>
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <p className="hero__trust-text">Over <strong>50+</strong> businesses trust AROM</p>
                </div>
            </div>
        </section>
    )
}
