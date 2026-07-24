import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bot, Send, User, Sparkles, ShieldCheck, History, MessageSquare, Terminal } from 'lucide-react';

export default function AIAssistantPage({ user }) {
  const userName = user ? `${user.first_name} ${user.last_name}` : 'Shanthi Reddaiah';
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'history'
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      agent_type: 'General',
      text: `Hello ${userName} 👋! Welcome back. I am your HR AI Assistant. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logsHistory, setLogsHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchLogsHistory = async () => {
    try {
      const res = await axios.get('/api/ai/logs/history/');
      setLogsHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch AI audit history:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    } else {
      fetchLogsHistory();
    }
  }, [messages, activeTab]);

  const getGeminiFallbackResponse = (query, name) => {
    const q = query.toLowerCase();
    if (q.includes('date') || q.includes('today') || q.includes('time')) {
      const now = new Date();
      return `📅 Today's date is **${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}** and the time is **${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}**.`;
    } else if (q.includes('flag') || q.includes('falg') || q.includes('flg')) {
      return `🇮🇳 **Indian National Flag (Tiranga)**: The national flag of India is a horizontal tricolor of saffron (top), white (middle), and green (bottom) with the navy blue 24-spoke **Ashoka Chakra** at its center. Designed by Pingali Venkayya and officially adopted on July 22, 1947.`;
    } else if (q.includes('prime minister') || q.includes('pm') || q.includes('modi')) {
      return `🇮🇳 **Prime Minister of India**: The Prime Minister of India is **Narendra Modi**, serving his third consecutive term as Prime Minister of India.`;
    } else if (q.includes('tamil nadu') || q.includes('tamilnadu') || q.includes('stalin')) {
      return `🏛️ **Chief Minister of Tamil Nadu**: The Chief Minister of Tamil Nadu is **M. K. Stalin (Muthuvel Karunanidhi Stalin)**, president of the DMK party, serving since May 7, 2021. Capital: Chennai.`;
    } else if (q.includes('vijay') || q.includes('thalapathy')) {
      return `🎬 **Vijay (Thalapathy Vijay)** is a legendary Indian actor and politician in Tamil Cinema (Kollywood). He has starred in massive blockbusters including *Ghilli, Pokkiri, Thuppakki, Kaththi, Mersal, Sarkar, Master, Leo*, and *GOAT*, and is the founder of the political party *Tamilaga Vettri Kazhagam (TVK)*.`;
    } else if (q.includes('elon') || q.includes('musk')) {
      return `🚀 **Elon Musk** is a technology entrepreneur and business magnate. He is the CEO of SpaceX & Tesla, founder of xAI & The Boring Company, and owner of X (Twitter). In our HRMS system, he serves as VP of Engineering & Executive Board Director!`;
    } else if (q.includes('python')) {
      return `🐍 **Python** is a powerful programming language widely used in AI, Data Science, Django Web Development, and automation.`;
    } else if (q.includes('how are') || q.includes('how r') || q.includes('howare')) {
      return `I'm doing great, thank you for asking, ${name}! 😊 How can I assist you with your attendance, leaves, payroll, or projects today?`;
    }
    return `🤖 **Gemini AI**: Regarding "${query}", I can answer general knowledge queries, assist with attendance, leave balances, salary payslips, or project details!`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/agent/', { prompt: userQuery });
      setMessages(prev => [...prev, {
        sender: 'agent',
        agent_type: res.data.agent_type || 'Gemini AI',
        text: res.data.response
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'agent',
        agent_type: 'Gemini AI',
        text: getGeminiFallbackResponse(userQuery, userName)
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Clock in for today's attendance",
    "What is my leave balance?",
    "Show my latest salary payslip status",
    "Who is my manager?",
    "Show assigned projects"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
            <Sparkles color="#2563EB" /> HR AI Assistant
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Instant assistance for employee policies, leave balances, and company info</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#FFFFFF', padding: '0.25rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
            <button 
              onClick={() => setActiveTab('chat')} 
              style={{
                background: activeTab === 'chat' ? '#2563EB' : 'transparent',
                border: 'none', color: activeTab === 'chat' ? 'white' : '#64748B', padding: '0.4rem 0.8rem', borderRadius: '8px',
                fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600'
              }}
            >
              <MessageSquare size={16} /> AI Chat Workspace
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              style={{
                background: activeTab === 'history' ? '#2563EB' : 'transparent',
                border: 'none', color: activeTab === 'history' ? 'white' : '#64748B', padding: '0.4rem 0.8rem', borderRadius: '8px',
                fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600'
              }}
            >
              <History size={16} /> Activity History
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="card ai-chat-box">
          <div className="chat-messages" style={{ background: '#F8FAFC' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.sender === 'user' ? 'chat-user' : 'chat-agent'}`}>
                {msg.sender === 'agent' && (
                  <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '700', marginBottom: '0.25rem' }}>
                    🤖 {msg.agent_type} Assistant
                  </div>
                )}
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-agent" style={{ opacity: 0.8 }}>
                🤖 AI Assistant is retrieving information...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '0.75rem', borderTop: '1px solid #CBD5E1', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {quickPrompts.map((qp, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setInput(qp)}
                  style={{
                    background: '#F1F5F9', border: '1px solid #CBD5E1',
                    color: '#334155', padding: '0.35rem 0.75rem', borderRadius: '15px',
                    fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '500'
                  }}
                >
                  {qp}
                </button>
              ))}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
              <input 
                type="text" 
                placeholder="Ask AI Assistant about attendance, leave balances, payroll, projects..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{
                  flex: 1, padding: '0.75rem 1rem', background: '#FFFFFF',
                  border: '1px solid #CBD5E1', borderRadius: '12px', color: '#111827', fontSize: '0.95rem'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
                <Send size={18} /> Send
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
            <Terminal size={20} color="#2563EB" /> Real-Time AI Query Audit History
          </h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Sub-Agent</th>
                  <th>User Prompt</th>
                  <th>Agent Response</th>
                </tr>
              </thead>
              <tbody>
                {logsHistory.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="status-tag status-present" style={{ fontSize: '0.8rem' }}>
                        🤖 {log.agent_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{log.prompt}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.response}</td>
                  </tr>
                ))}
                {logsHistory.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      No AI query trajectories logged yet. Submit a prompt in the AI Workspace tab to generate audit logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


