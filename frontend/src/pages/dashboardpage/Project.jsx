import { FolderKanban } from 'lucide-react'

export default function Project() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="chat-header">
                <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FolderKanban /> Projects
                </h2>
                <p className="text-secondary">View and manage ongoing automation projects.</p>
            </div>

            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                <h3 className="text-h3" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Feature Coming Soon</h3>
                <p className="text-muted">Space reserved for future Projects board integration.</p>
            </div>
        </div>
    )
}
