import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { queryAPI, feedbackAPI } from '../../services/api'
import { Send, ThumbsUp, ThumbsDown, Loader2, Zap, Search, FileText, Mail } from 'lucide-react'
import './Overview.css'

export default function Overview() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [correctionData, setCorrectionData] = useState({ queryId: null, text: '' })
    const messagesEndRef = useRef(null)

    const scrollToBottom = (force = false) => {
        const container = messagesEndRef.current?.parentElement
        if (!container) return

        // "Sticky" scroll: only scroll if the user is already at the bottom (or if forced)
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100
        if (isAtBottom || force) {
            messagesEndRef.current?.scrollIntoView({ behavior: force ? 'smooth' : 'auto' })
        }
    }

    useEffect(() => {
        scrollToBottom(loading && !messages.some(m => m.isStreaming))
    }, [messages, loading])

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMsg = { id: Date.now(), role: 'user', text: input }
        const aiMsgId = Date.now() + 1
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        const aiPlaceholder = {
            id: aiMsgId,
            role: 'assistant',
            text: '',
            query_id: null,
            confidence: 0.85,
            decision: 'AUTO',
            isStreaming: true,
            toolEvents: []
        }
        setMessages(prev => [...prev, aiPlaceholder])

        try {
            const result = await queryAPI.streamSubmit(userMsg.text, (token, fullText) => {
                setMessages(prev =>
                    prev.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m)
                )
                scrollToBottom()
            }, (toolEvent) => {
                setMessages(prev =>
                    prev.map(m => m.id === aiMsgId
                        ? { ...m, toolEvents: [...(m.toolEvents || []), toolEvent] }
                        : m
                    )
                )
                scrollToBottom()
            })

            // Finalize the message with query_id after streaming completes
            setMessages(prev =>
                prev.map(m => m.id === aiMsgId
                    ? { ...m, text: result.answer, query_id: result.query_id, isStreaming: false }
                    : m
                )
            )
        } catch (error) {
            console.error(error)
            setMessages(prev =>
                prev.map(m => m.id === aiMsgId
                    ? { ...m, text: "Error connecting to AI backend.", isError: true, isStreaming: false }
                    : m
                )
            )
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (queryId) => {
        try {
            await feedbackAPI.accept(queryId, 5) // Sending rating 5 as a default for accept
            setMessages(prev => prev.map(m => m.query_id === queryId ? { ...m, feedbackStatus: 'accepted' } : m))
        } catch (error) {
            console.error('Failed to submit feedback:', error)
        }
    }

    const handleRejectSubmit = async (queryId) => {
        if (!correctionData.text.trim()) return
        try {
            setLoading(true)
            const res = await feedbackAPI.reject(queryId, correctionData.text)

            // Revert feedback UI for this item
            setCorrectionData({ queryId: null, text: '' })
            setMessages(prev => prev.map(m => m.query_id === queryId ? { ...m, feedbackStatus: 'rejected' } : m))

            // Add new assistant refinement message
            const aiMsg = {
                id: Date.now(),
                role: 'assistant',
                text: res.answer,
                query_id: res.query_id,
                confidence: res.confidence,
                decision: res.decision,
                isRefined: true
            }
            setMessages(prev => [...prev, aiMsg])

        } catch (error) {
            console.error('Failed to submit rejection:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="overview-container">
            <div className="chat-header">
                <h2 className="text-h2">AI Automation Agent</h2>
                <p className="text-secondary">Ask questions against indexed company workflows or provide feedback to improve accuracy.</p>
            </div>

            <div className="chat-window card">
                <div className="messages-list">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <Zap size={48} className="empty-icon" />
                            <h3 className="text-h3">Ready to Automate</h3>
                            <p className="text-muted">Start by typing your query below.</p>
                        </div>
                    )}

                    {messages.map(msg => (
                        <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                            <div className="message-bubble">
                                {/* Tool Activity Indicator */}
                                {msg.toolEvents && msg.toolEvents.length > 0 && (
                                    <div className="tool-activity">
                                        {msg.toolEvents.map((evt, i) => (
                                            <div key={i} className={`tool-event ${evt.type}`}>
                                                {evt.type === 'tool_call' && (
                                                    <>
                                                        {evt.toolName === 'gmail_intelligence_tool'
                                                            ? <Mail size={13} />
                                                            : <Search size={13} />}
                                                        <span>Calling <strong>{evt.toolName === 'rag_tool' ? 'Document Search' : evt.toolName === 'gmail_intelligence_tool' ? 'Gmail Analysis' : evt.toolName}</strong></span>
                                                    </>
                                                )}
                                                {evt.type === 'tool_result' && (
                                                    <>
                                                        <FileText size={13} />
                                                        <span>
                                                            {evt.sources && evt.sources.length > 0
                                                                ? <>Sources: {evt.sources.map((s, j) => <span key={j} className="source-tag">{s}</span>)}</>
                                                                : <>Tool completed</>}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="message-content markdown-body">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    {msg.isStreaming && <span className="streaming-cursor" />}
                                </div>
                                {msg.role === 'assistant' && !msg.isError && !msg.isStreaming && (
                                    <div className="message-meta">
                                        <span className={`confidence-badge ${msg.decision?.toLowerCase()}`}>
                                            Confidence: {(msg.confidence * 100).toFixed(1)}% ({msg.decision})
                                        </span>
                                        {msg.isRefined && <span className="refined-badge">Refined Answer</span>}
                                    </div>
                                )}
                            </div>

                            {/* Feedback UI */}
                            {msg.role === 'assistant' && !msg.isError && !msg.isStreaming && !msg.feedbackStatus && (
                                <div className="feedback-ui">
                                    <span className="feedback-prompt">Was this helpful?</span>
                                    <div className="feedback-actions">
                                        <button className="feedback-btn action-accept" onClick={() => handleAccept(msg.query_id)}><ThumbsUp size={14} /></button>
                                        <button className="feedback-btn action-reject" onClick={() => setCorrectionData({ queryId: msg.query_id, text: '' })}><ThumbsDown size={14} /></button>
                                    </div>
                                </div>
                            )}

                            {/* Rejection Correction Input */}
                            {msg.role === 'assistant' && correctionData.queryId === msg.query_id && !msg.feedbackStatus && (
                                <div className="correction-box">
                                    <textarea
                                        className="input correction-input"
                                        placeholder="What should be corrected?"
                                        value={correctionData.text}
                                        onChange={e => setCorrectionData({ ...correctionData, text: e.target.value })}
                                    />
                                    <div className="correction-actions">
                                        <button className="btn-ghost" onClick={() => setCorrectionData({ queryId: null, text: '' })}>Cancel</button>
                                        <button className="btn-primary" onClick={() => handleRejectSubmit(msg.query_id)}>Submit Correction</button>
                                    </div>
                                </div>
                            )}

                            {msg.feedbackStatus === 'accepted' && <div className="feedback-thanks">Feedback recorded. Thank you!</div>}
                        </div>
                    ))}
                    {loading && !messages.some(m => m.isStreaming) && (
                        <div className="message-wrapper assistant">
                            <div className="message-bubble loading-bubble">
                                <Loader2 className="spinner" size={20} /> Starting AI engine...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="input chat-input"
                        placeholder="Enter your prompt here..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" className="btn-primary send-btn" disabled={!input.trim() || loading}>
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    )
}