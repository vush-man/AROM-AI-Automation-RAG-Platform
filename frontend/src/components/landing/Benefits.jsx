import { Zap, Smile, Clock, DollarSign, BarChart2, TrendingUp } from 'lucide-react'
import './Benefits.css'

const BENEFITS = [
    { icon: <Zap size={24} />, title: 'Increased Productivity', desc: 'AI handles repetitive tasks, freeing your team to focus on high-value, strategic work.' },
    { icon: <Smile size={24} />, title: 'Better Customer Experience', desc: 'Personalized AI interactions improve response times and customer satisfaction at scale.' },
    { icon: <Clock size={24} />, title: '24/7 Availability', desc: 'Automated systems operate around the clock, ensuring seamless execution without downtime.' },
    { icon: <DollarSign size={24} />, title: 'Cost Reduction', desc: 'Cut operational costs and optimize resource allocation with intelligent automation.' },
    { icon: <BarChart2 size={24} />, title: 'Data-Driven Insights', desc: 'Analyze vast datasets, identify trends, and make faster, smarter business decisions.' },
    { icon: <TrendingUp size={24} />, title: 'Scalability & Growth', desc: 'Scale your operations efficiently without proportionally increasing workload or headcount.' },
]

export default function Benefits() {
    return (
        <section id="benefits" className="section">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">Benefits</span>
                    <h2 className="text-h2">The Key Benefits of AI for<br />Your Business Growth</h2>
                    <p>Discover how automation enhances efficiency, reduces costs, and drives growth.</p>
                </div>

                <div className="benefits-grid">
                    {BENEFITS.map(b => (
                        <div key={b.title} className="benefit-card">
                            <div className="benefit-card__icon">{b.icon}</div>
                            <div>
                                <h3 className="benefit-card__title">{b.title}</h3>
                                <p className="benefit-card__desc">{b.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
