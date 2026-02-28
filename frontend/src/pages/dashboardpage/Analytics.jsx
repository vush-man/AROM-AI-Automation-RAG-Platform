import { useEffect, useState } from 'react'
import { feedbackAPI } from '../../services/api'
import { BarChart3, Tally4, ThumbsUp, ThumbsDown, Star } from 'lucide-react'

export default function Analytics() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await feedbackAPI.stats()
                setStats(data)
            } catch (error) {
                console.error('Failed to fetch analytics', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="chat-header">
                <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BarChart3 /> Analytics Dashboard
                </h2>
                <p className="text-secondary">Review AI accuracy and feedback performance metrics.</p>
            </div>

            {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading analytics...</div>
            ) : !stats ? (
                <div style={{ color: 'var(--text-muted)' }}>No statistics available.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}><Tally4 size={18} /> Total Feedback</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.total_feedback || 0}</div>
                    </div>

                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}><ThumbsUp size={18} /> Accepted</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.accepted_count || 0}</div>
                    </div>

                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}><ThumbsDown size={18} /> Rejected</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.rejected_count || 0}</div>
                    </div>

                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}><Star size={18} /> Avg Rating</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.average_rating || 'N/A'}</div>
                    </div>
                </div>
            )}

            <div className="card" style={{ marginTop: '20px' }}>
                <h3 className="text-h3" style={{ marginBottom: '12px' }}>System Improvement Over Time</h3>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Feature coming soon - Real-time charting will be connected here</span>
                </div>
            </div>
        </div>
    )
}
