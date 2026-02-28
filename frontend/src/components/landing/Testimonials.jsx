import './Testimonials.css'

const TESTIMONIALS = [
    { quote: "AROM's automation eliminated hours of manual work overnight. Our team now focuses on what actually moves the needle.", name: 'James Carter', role: 'CEO @ TechFlow' },
    { quote: "The RAG pipeline AROM built us transformed how we handle customer feedback. Accuracy went from 60% to 97%.", name: 'Sophia Martinez', role: 'Ops Manager @ NexaCorp' },
    { quote: "We went from manually hunting leads to having a full pipeline delivered every morning. Game changer.", name: 'David Reynolds', role: 'Head of Sales @ GrowthPeak' },
    { quote: "Our support response time dropped by 70%. The AI handles the routine queries and escalates the real ones.", name: 'Emily Wong', role: 'Customer Success @ SupportHive' },
    { quote: "AROM built a custom scraper that feeds our CRM daily. It would have taken our dev team months.", name: 'Ryan Patel', role: 'Founder @ LeadStack' },
    { quote: "The data transformation service alone saved us from hiring 2 extra people.", name: 'Priya Nair', role: 'COO @ DataBridge' },
]

function TestimonialCard({ t }) {
    return (
        <div className="testimonial-card">
            <p className="testimonial-card__quote">&ldquo;{t.quote}&rdquo;</p>
            <div className="testimonial-card__author">
                <div className="testimonial-card__avatar">{t.name.charAt(0)}</div>
                <div>
                    <div className="testimonial-card__name">{t.name}</div>
                    <div className="testimonial-card__role">{t.role}</div>
                </div>
            </div>
        </div>
    )
}

export default function Testimonials() {
    // Duplicate for infinite loop effect
    const items = [...TESTIMONIALS, ...TESTIMONIALS]

    return (
        <section className="section">
            <div className="container">
                <div className="section-header">
                    <span className="section-label">Testimonials</span>
                    <h2 className="text-h2">Why Businesses Love AROM</h2>
                    <p>Real businesses, real results with AI automation.</p>
                </div>
            </div>

            <div className="testimonials-marquee">
                <div className="testimonials-track">
                    {items.map((t, i) => (
                        <TestimonialCard key={`${t.name}-${i}`} t={t} />
                    ))}
                </div>
            </div>
        </section>
    )
}
