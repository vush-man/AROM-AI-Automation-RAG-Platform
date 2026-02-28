import { useState } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import './Pricing.css'

const PLANS = [
    {
        name: 'Starter',
        monthly: 37,
        annual: 30,
        desc: 'Perfect for small businesses beginning their automation journey.',
        features: [
            'Basic workflow automation',
            'AI-powered task assistant',
            'Standard analytics & reporting',
            'Email & chat support',
            'Up to 3 AI integrations',
        ],
        cta: 'Choose Plan',
        popular: false,
    },
    {
        name: 'Professional',
        monthly: 75,
        annual: 60,
        desc: 'Perfect for growing teams needing advanced automation.',
        features: [
            'Advanced workflow automation',
            'Web scraping & data pipelines',
            'RAG data transformation (up to 10k records)',
            'AI-driven sales & marketing tools',
            'Priority customer support',
            'Up to 10 AI integrations',
        ],
        cta: 'Choose Plan',
        popular: true,
    },
    {
        name: 'Enterprise',
        monthly: null,
        annual: null,
        desc: 'For large teams with complex, high-volume needs.',
        features: [
            'Fully customizable AI automation',
            'Dedicated AROM consultant',
            'Unlimited RAG pipelines',
            'Enterprise-grade compliance & security',
            '24/7 VIP support',
            'Unlimited integrations',
        ],
        cta: 'Schedule a Call',
        popular: false,
    },
]

export default function Pricing() {
    const [annual, setAnnual] = useState(false)

    return (
        <section id="pricing" className="section" style={{ background: 'transparent' }}>
            <div className="container">
                <div className="section-header">
                    <span className="section-label">Pricing</span>
                    <h2 className="text-h2">The Best AI Automation,<br />at the Right Price</h2>
                    <p>Choose a plan that fits your business and start automating today.</p>
                </div>

                <div className="pricing-toggle">
                    <span className={!annual ? 'pricing-toggle__label--active' : ''}>Monthly</span>
                    <button
                        className={`pricing-toggle__switch ${annual ? 'pricing-toggle__switch--on' : ''}`}
                        onClick={() => setAnnual(!annual)}
                        aria-label="Toggle billing period"
                    >
                        <span className="pricing-toggle__pill" />
                    </button>
                    <span className={annual ? 'pricing-toggle__label--active' : ''}>
                        Annually <span className="pricing-toggle__save">Save 20%</span>
                    </span>
                </div>

                <div className="pricing-grid">
                    {PLANS.map(p => (
                        <div key={p.name} className={`card pricing-card ${p.popular ? 'pricing-card--popular' : ''}`}>
                            {p.popular && <span className="pricing-popular-badge">⭐ Popular</span>}
                            <h3 className="pricing-card__name">{p.name}</h3>
                            <div className="pricing-card__price">
                                {p.monthly !== null ? (
                                    <>
                                        <span className="pricing-card__amount">${annual ? p.annual : p.monthly}</span>
                                        <span className="pricing-card__period">/{annual ? 'year' : 'month'}</span>
                                    </>
                                ) : (
                                    <span className="pricing-card__amount">Custom</span>
                                )}
                            </div>
                            <p className="pricing-card__desc">{p.desc}</p>
                            <ul className="pricing-card__features">
                                {p.features.map(f => (
                                    <li key={f}><Check size={16} className="pricing-check" /> {f}</li>
                                ))}
                            </ul>
                            <button className={p.popular ? 'btn-primary pricing-card__cta' : 'btn-secondary pricing-card__cta'}>
                                {p.cta} <ArrowRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
