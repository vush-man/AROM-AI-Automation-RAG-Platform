import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import './FAQ.css'

const FAQS = [
    {
        q: 'How can AI automation help my business?',
        a: 'Automation eliminates repetitive, time-consuming tasks — freeing your team for high-value work, reducing errors, and lowering operating costs. AROM maps your workflows and deploys targeted AI tools.',
    },
    {
        q: 'Is AI automation difficult to integrate?',
        a: 'Not with AROM. We handle the full integration process — from discovery to deployment — with minimal disruption to your existing systems.',
    },
    {
        q: 'What industries can benefit from AI automation?',
        a: 'Virtually all industries benefit: healthcare, finance, e-commerce, logistics, marketing, legal, and more. If you have repetitive processes or large amounts of data, automation can help.',
    },
    {
        q: 'Do I need technical knowledge to use AI automation?',
        a: 'No. AROM builds and manages everything. You describe your problem; we build the solution.',
    },
    {
        q: 'What kind of support do you offer?',
        a: 'All plans include email & chat support. Professional plans get priority response. Enterprise clients get a dedicated 24/7 support line and a personal AROM consultant.',
    },
]

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null)

    const toggle = (i) => setOpenIndex(openIndex === i ? null : i)

    return (
        <section className="section" style={{ background: 'transparent' }}>
            <div className="container">
                <div className="section-header">
                    <span className="section-label">FAQs</span>
                    <h2 className="text-h2">We&apos;ve Got the Answers<br />You&apos;re Looking For</h2>
                    <p>Quick answers to your AI automation questions.</p>
                </div>

                <div className="faq-list">
                    {FAQS.map((item, i) => (
                        <div
                            key={i}
                            className={`faq-item ${openIndex === i ? 'faq-item--open' : ''}`}
                        >
                            <button className="faq-item__trigger" onClick={() => toggle(i)}>
                                <span className="faq-item__question">{item.q}</span>
                                <span className="faq-item__icon">
                                    {openIndex === i ? <X size={18} /> : <Plus size={18} />}
                                </span>
                            </button>
                            <div className="faq-item__answer">
                                <p>{item.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
