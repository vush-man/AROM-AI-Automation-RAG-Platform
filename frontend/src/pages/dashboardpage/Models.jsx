import { Brain } from 'lucide-react'

export default function Models() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="chat-header">
                <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Brain /> Models
                </h2>
                <p className="text-secondary">Configure AI automation models and routing logic.</p>
            </div>

            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                <h3 className="text-h3" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Feature Coming Soon</h3>
                <p className="text-muted">Space reserved for future Model Configuration options.</p>
            </div>
        </div>
    )
}
