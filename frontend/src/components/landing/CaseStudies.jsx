import './CaseStudies.css'

const CASES = [
    {
        company: 'DataForge Manufacturing',
        quote: '"AI data pipelines cut our processing time by 60% in 6 weeks"',
        desc: 'DataForge was manually cleaning and reformatting supplier data. AROM built a fully automated RAG pipeline that structured all incoming data and fed it directly into their internal AI model.',
        stats: ['60% Faster Processing', '98% Data Accuracy', '40+ Hours Saved/Month', 'RAG-Ready Output'],
    },
    {
        company: 'MedixChain Healthcare',
        quote: '"AI-powered workflows reduced our error rate by 80% overnight"',
        desc: 'MedixChain dealt with frequent data errors in their logistics chain. AROM introduced automated validation layers and live tracking to dramatically improve accuracy.',
        stats: ['80% Error Reduction', '90% Log Accuracy', '30% Faster Delivery', '60+ Hours Saved'],
    },
    {
        company: 'FinSolve Financial',
        quote: '"Automating 50% of operations saved 20% in costs within 2 months"',
        desc: 'FinSolve was drowning in repetitive admin. AROM automated their internal workflows and integrated all data systems, reducing overhead and freeing staff for strategic work.',
        stats: ['50% Ops Automated', '20% Cost Reduction', '70+ Hours Saved/Month', '2x Faster Onboarding'],
    },
    {
        company: 'ScaleByte Sales',
        quote: '"AI scraping and outreach helped us close 3x more deals"',
        desc: 'ScaleByte\'s team was manually finding and emailing leads. AROM built an automated scraping + outreach pipeline that handled lead collection, scoring, and CRM sync.',
        stats: ['3x More Deals', '40% Faster Responses', '95% Lead Accuracy', 'CRM Fully Synced'],
    },
]

export default function CaseStudies() {
    return (
        <section id="cases" className="section" style={{ background: 'transparent' }}>
            <div className="container">
                <div className="section-header">
                    <span className="section-label">Case Studies</span>
                    <h2 className="text-h2">See How Smart AI Automation<br />Transforms Businesses</h2>
                    <p>Real workflows, real results.</p>
                </div>

                <div className="cases-carousel">
                    {CASES.map(c => (
                        <div key={c.company} className="case-card">
                            <div className="case-card__badge">{c.company.split(' ')[0]}</div>
                            <blockquote className="case-card__quote">{c.quote}</blockquote>
                            <p className="case-card__desc">{c.desc}</p>
                            <div className="case-card__stats">
                                {c.stats.map(s => (
                                    <span key={s} className="case-stat">{s}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
