import { HelpCircle } from 'lucide-react'

export default function Helpdesk() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="chat-header">
                <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <HelpCircle /> Help Desk
                </h2>
                <p className="text-secondary">View active tickets and automated triage queue.</p>
            </div>

            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                <h3 className="text-h3" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Feature Coming Soon</h3>
                <p className="text-muted">Space reserved for future Helpdesk module integration.</p>
            </div>
        </div>
    )
}
