import { Cog, Globe, Brain, Wrench } from 'lucide-react'
import './Services.css'
import { GlowCard } from '../ui/spotlight-card';

const SERVICES = [
    {
        icon: <Cog size={28} />,
        title: 'Workflow Automation',
        desc: 'We eliminate manual workflows — approvals, data entry, reporting, and internal pipelines — saving time and cutting errors across your entire operation.',
        tags: ['Internal Task Bots', '100+ Automations'],
        widget: (
            <div className="service-widget">
                <div className="sw-header"><span>All Tasks</span><span className="sw-filter">Filter</span></div>
                <div className="sw-item sw-item--active"><span className="sw-dot" />Payroll management<span className="sw-meta">Due on 2nd July</span></div>
                <div className="sw-item sw-item--active"><span className="sw-dot sw-dot--running" />Data entry automation<span className="sw-meta">Running · 80% done</span></div>
                <div className="sw-item"><span className="sw-dot sw-dot--waiting" />Approval chain<span className="sw-meta">Waiting for review</span></div>
                <div className="sw-item"><span className="sw-dot sw-dot--done" />Report generation<span className="sw-meta">Completed ✓</span></div>
            </div>
        ),
    },
    {
        icon: <Globe size={28} />,
        title: 'Web Scraping & Data',
        desc: 'Intelligent scraping systems that pull structured data from any source, at scale and in real time — ready for pipelines, dashboards, or model training.',
        tags: ['Real-time Extraction', 'Structured Output'],
        widget: (
            <div className="service-widget">
                <div className="sw-header"><span>Scraping.. LinkedIn</span><span className="sw-filter">IT Services</span></div>
                <div className="sw-divider" />
                <div className="sw-label">Founders</div>
                <div className="sw-item"><span className="sw-dot" />Jack Daniel <span className="sw-meta">justin@...</span></div>
                <div className="sw-item"><span className="sw-dot" />Mike Tylor <span className="sw-meta">mike@...</span></div>
                <div className="sw-item"><span className="sw-dot" />Gorge Chapel <span className="sw-meta">gorge@...</span></div>
                <div className="sw-actions"><span>Draft</span><span>Schedule</span><span>Export</span></div>
            </div>
        ),
    },
    {
        icon: <Brain size={28} />,
        title: 'RAG Data Transformation',
        desc: 'Convert raw feedback, reviews, and unstructured text into clean, keyword-optimized data ready for AI models, vector databases, and retrieval-augmented pipelines.',
        tags: ['Feedback → Keywords', 'RAG-Ready Output'],
        widget: (
            <div className="service-widget">
                <div className="sw-header"><span>🤖 AROM Assistant</span></div>
                <div className="sw-divider" />
                <div className="sw-chat-msg">What can I help with?</div>
                <div className="sw-chat-msg sw-chat-msg--dim">Feed me raw data or text and I&apos;ll structure it.</div>
                <div className="sw-actions"><span>Add document</span><span>Analyze</span><span>Generate Keywords</span></div>
            </div>
        ),
    },
    {
        icon: <Wrench size={28} />,
        title: 'Custom AI Projects',
        desc: 'From strategy to deployment — we build fully custom automation systems and AI integrations aligned with your unique business goals.',
        tags: ['Strategy', 'Custom AI', 'Consulting'],
        widget: (
            <div className="service-widget">
                <div className="sw-header"><span>Hey! Here&apos;s your project</span></div>
                <div className="sw-divider" />
                <div className="sw-label">Ongoing: RAG Pipeline v2</div>
                <div className="sw-progress"><div className="sw-progress-bar" style={{ width: '80%' }} /><span>80%</span></div>
                <div className="sw-label" style={{ marginTop: '8px' }}>Schedule</div>
                <div className="sw-calendar">
                    {'Mo Tu We Th Fr Sa Su'.split(' ').map((d, i) => (
                        <span key={d} className={`sw-cal-day ${i === 2 || i === 4 ? 'sw-cal-day--active' : ''}`}>{d}</span>
                    ))}
                </div>
            </div>
        )
    },
]

export default function Services() {
    return (

        <section id="services" className="section" style={{ background: 'transparent' }}>
            <div className="container">
                <div className="section-header">
                    <span className="section-label">Our Services</span>
                    <h2 className="text-h2">AI Solutions That Take Your Business<br />to the Next Level</h2>
                    <p>We design, develop, and implement automation tools that help you work smarter, not harder.</p>
                </div>

                <div className="services-grid">
                    {SERVICES.map(s => (
                        <GlowCard key={s.title} glowColor="purple" customSize={true} className="card service-card">
                            <div className="service-card__top">
                                <div className="service-card__icon">{s.icon}</div>
                                <h3 className="text-h3">{s.title}</h3>
                                <p className="service-card__desc">{s.desc}</p>
                                <div className="service-card__tags">
                                    {s.tags.map(t => <span key={t} className="service-tag">{t}</span>)}
                                </div>
                            </div>
                            <div className="service-card__widget">{s.widget}</div>
                        </GlowCard>
                    ))}
                </div>
            </div>
        </section>
    )
}
