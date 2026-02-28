import { useEffect, useState } from 'react'
import { queryAPI } from '../../services/api'
import { History as HistoryIcon, Clock } from 'lucide-react'

export default function History() {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchHistory() {
            try {
                const data = await queryAPI.history(50)
                setHistory(data)
            } catch (error) {
                console.error('Failed to fetch history', error)
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="chat-header">
                <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <HistoryIcon /> Query History
                </h2>
                <p className="text-secondary">Review your past queries and automated actions.</p>
            </div>

            <div className="card">
                {loading ? (
                    <div style={{ color: 'var(--text-muted)' }}>Loading history...</div>
                ) : history.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>No query history found.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {history.map(item => (
                            <div key={item.id} style={{
                                padding: '16px',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-secondary)'
                            }}>
                                <div style={{ fontWeight: 500, marginBottom: '8px' }}>{item.query_text}</div>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> {new Date(item.created_at).toLocaleString()}
                                    </span>
                                    <span>Chunks accessed: {item.result_count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
