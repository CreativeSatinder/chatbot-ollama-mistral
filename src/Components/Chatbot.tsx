import React, { useState } from 'react';
import axios from 'axios';
import './Chatbot.css'; // We'll create this CSS file next

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const Chatbot: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage: Message = { sender: 'user', text: input };
  
    // Add user message and empty bot message placeholder
    setMessages((prev) => [
      ...prev,
      userMessage,
      { sender: 'bot', text: '' },
    ]);
  
    setInput('');
    setLoading(true);
  
    try {
      const controller = new AbortController();
      const response = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral',
          messages: [{ role: 'user', content: input }],
        }),
        signal: controller.signal,
      });
  
      if (!response.body) {
        throw new Error('No response body');
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullMessage = '';
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
  
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const content = parsed?.message?.content || '';
            fullMessage += content;
  
            // Update only the last message (the bot placeholder)
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { sender: 'bot', text: fullMessage };
              return updated;
            });
  
          } catch (err) {
            console.error('JSON parse error:', err);
          }
        }
      }
  
    } catch (error) {
      console.error('Streaming error:', error);
      setMessages((prev) => [
        ...prev,
        { text: 'Something went wrong.', sender: 'bot' },
      ]);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="chatbot-container">
      <h2>🤖 Hi, I am Bot Singh. I am here to help you. Ask me anything..</h2>
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
      </div>
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          rows={2}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
