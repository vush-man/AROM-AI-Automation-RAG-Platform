import { Search, Code, Plug, BarChart3 } from 'lucide-react'
import './Process.css'

const STEPS = [
    {
        num: '01',
        icon: <Search size={22} />,
        title: 'Smart Analyzing',
        desc: 'We assess your workflows and identify the highest-impact automation opportunities.',
        widget: (
            <div className="process-widget">
                <div className="pw-title">Analyzing current workflow...</div>
                <div className="pw-item pw-item--done">✓ System check</div>
                <div className="pw-item pw-item--done">✓ Process check</div>
                <div className="pw-item pw-item--loading">⟳ Speed check</div>
                <div className="pw-item">Manual tasks</div>
                <div className="pw-item">Repetitive patterns</div>
            </div>
        ),
    },
    {
        num: '02',
        icon: <Code size={22} />,
        title: 'AI Development',
        desc: 'Our team builds intelligent automation systems tailored to your exact business processes.',
        widget: (
            <div className="process-widget process-widget--code">
                <pre className="pw-code">{`class AutomationTrigger:
  def __init__(self, threshold):
    self.threshold = threshold
    self.status = "inactive"

  def check_trigger(self, value):
    if value > self.threshold:
      self.status = "active"
      return "Automation triggered!"
    return "No action taken."`}</pre>
            </div>
        ),
    },
    {
        num: '03',
        icon: <Plug size={22} />,
        title: 'Seamless Integration',
        desc: 'We plug our solutions into your existing stack with minimal disruption.',
        widget: (
            <div className="process-widget">
                <div className="pw-connector">
                    <div className="pw-connector-box">AROM Solution</div>
                    <div className="pw-connector-line">←→</div>
                    <div className="pw-connector-box">Your Stack</div>
                </div>
                <div className="pw-integrations">Zapier · Make · n8n · APIs</div>
            </div>
        ),
    },
    {
        num: '04',
        icon: <BarChart3 size={22} />,
        title: 'Continuous Optimization',
        desc: 'We monitor, refine, and evolve your systems for long-term performance.',
        widget: (
            <div className="process-widget">
                <div className="pw-status"><span className="pw-status-dot pw-status-dot--green" /> Chatbot system <span className="pw-status-val">↑ +20% efficiency</span></div>
                <div className="pw-status"><span className="pw-status-dot pw-status-dot--yellow" /> Workflow system <span className="pw-status-val">Update available</span></div>
                <div className="pw-status"><span className="pw-status-dot pw-status-dot--green" /> Sales pipeline <span className="pw-status-val">Up to date ✓</span></div>
            </div>
        ),
    },
]

export default function Process() {
    return (
        <section id="process" className="section">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">Our Process</span>
                    <h2 className="text-h2">Our Simple, Smart, and<br />Scalable Process</h2>
                    <p>We design, develop, and implement automation tools that help you work smarter, not harder.</p>
                </div>

                <div className="process-steps">
                    {STEPS.map((s, i) => (
                        <div key={s.num} className="process-step">
                            <div className="process-step__left">
                                <div className="process-step__num">{s.num}</div>
                                <div className="process-step__icon">{s.icon}</div>
                                <h3 className="text-h3">{s.title}</h3>
                                <p className="process-step__desc">{s.desc}</p>
                            </div>
                            <div className="process-step__right">
                                {s.widget}
                            </div>
                            {i < STEPS.length - 1 && <div className="process-step__line" />}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
