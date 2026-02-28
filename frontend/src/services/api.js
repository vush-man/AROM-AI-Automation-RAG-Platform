/**
 * API Service — single source of truth for all backend calls.
 *
 * Uses the Vite proxy (/api → localhost:5000) in dev.
 * All authenticated calls automatically attach the JWT token.
 */

const API_BASE = '/api';

// ── Token helpers ────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('slingshot_token');
export const setToken = (token) => localStorage.setItem('slingshot_token', token);
export const clearToken = () => localStorage.removeItem('slingshot_token');

export const getUser = () => {
    try {
        const raw = localStorage.getItem('slingshot_user');
        if (!raw || raw === 'undefined') return null;
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        localStorage.removeItem('slingshot_user');
        return null;
    }
};
export const setUser = (user) => localStorage.setItem('slingshot_user', JSON.stringify(user));
export const clearUser = () => localStorage.removeItem('slingshot_user');

// ── Core fetch wrapper ──────────────────────────────────────────────
const apiFetch = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.error || `Request failed (${response.status})`);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

// ══════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════

export const authAPI = {
    signup: async ({ name, email, password, confirmPassword }) => {
        const data = await apiFetch('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, confirmPassword }),
        });
        return data;
    },

    login: async ({ email, password }) => {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        // Store token and user info
        if (data.token) {
            setToken(data.token);
            setUser(data.user);
        }
        return data;
    },

    logout: () => {
        clearToken();
        clearUser();
    },

    isAuthenticated: () => !!getToken(),
};

// ══════════════════════════════════════════════════════════════════════
// QUERY
// ══════════════════════════════════════════════════════════════════════

export const queryAPI = {
    submit: async (queryText) => {
        return apiFetch('/query', {
            method: 'POST',
            body: JSON.stringify({ query: queryText }),
        });
    },

    /**
     * Stream AI response via SSE. Calls onToken for each word as it arrives.
     * Calls onToolEvent when a tool call or tool result event is received.
     * Returns { query_id, full_answer } when done.
     */
    streamSubmit: async (queryText, onToken, onToolEvent) => {
        const token = getToken();
        const response = await fetch(`${API_BASE}/query/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ query: queryText }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Stream failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let queryId = null;
        let fullAnswer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const parsed = JSON.parse(line.slice(6));
                        if (parsed.query_id) queryId = parsed.query_id;
                        if (parsed.token) {
                            fullAnswer += parsed.token;
                            onToken(parsed.token, fullAnswer);
                        }
                        if (parsed.tool_call && onToolEvent) {
                            onToolEvent({ type: 'tool_call', toolName: parsed.tool_name, toolArgs: parsed.tool_args });
                        }
                        if (parsed.tool_result && onToolEvent) {
                            onToolEvent({ type: 'tool_result', toolName: parsed.tool_name, sources: parsed.sources });
                        }
                        if (parsed.done) {
                            fullAnswer = parsed.full_answer || fullAnswer;
                        }
                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                    } catch (e) {
                        if (e.message && !e.message.includes('JSON')) throw e;
                    }
                }
            }
        }

        return { query_id: queryId, answer: fullAnswer };
    },

    history: async (limit = 50) => {
        return apiFetch(`/query/history?limit=${limit}`);
    },
};

// ══════════════════════════════════════════════════════════════════════
// FEEDBACK
// ══════════════════════════════════════════════════════════════════════

export const feedbackAPI = {
    accept: async (queryId, rating) => {
        return apiFetch('/feedback', {
            method: 'POST',
            body: JSON.stringify({ query_id: queryId, accepted: true, rating }),
        });
    },

    reject: async (queryId, correction) => {
        return apiFetch('/feedback', {
            method: 'POST',
            body: JSON.stringify({ query_id: queryId, accepted: false, correction }),
        });
    },

    stats: async () => {
        return apiFetch('/feedback/stats');
    },

    history: async (queryId) => {
        return apiFetch(`/feedback/history/${queryId}`);
    },
};
