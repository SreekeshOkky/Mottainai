// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { MottainaiItem, updateItem } from '@/lib/db';
import { type CurrencyInfo } from '@/lib/currency';
import styles from './ChatModal.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Decision {
  status: string;
  reason: string;
}

interface ChatModalProps {
  item: MottainaiItem;
  currency: CurrencyInfo;
  onClose: () => void;
  onComplete: () => void;
}

export default function ChatModal({ item, currency, onClose, onComplete }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Always holds the latest messages — prevents stale-closure bugs in sendMessage
  const messagesRef = useRef<Message[]>([]);
  // Guards against double-fire in React Strict Mode (dev) or accidental re-mounts
  const hasOpenedRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fire opening message from AI on mount (exactly once)
  useEffect(() => {
    if (hasOpenedRef.current) return;
    hasOpenedRef.current = true;

    const openChat = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [],
            itemName: item.name,
            currencyCode: currency.code,
            currencySymbol: currency.symbol,
            region: currency.region,
          }),
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        const openingMsg: Message = { id: 'opening', role: 'assistant', content: data.content };
        messagesRef.current = [openingMsg];
        setMessages([openingMsg]);
      } catch (err) {
        console.error(err);
        const fallback: Message = {
          id: 'opening',
          role: 'assistant',
          content: `Hey! So you're thinking about "${item.name}" — let's see if it's really worth it. What's the main reason you want it?`,
        };
        messagesRef.current = [fallback];
        setMessages([fallback]);
      } finally {
        setIsLoading(false);
      }
    };
    openChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (userText: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText,
    };

    // Read from ref to get latest messages (avoids stale closure)
    const nextMessages = [...messagesRef.current, userMsg];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send full conversation history (all messages are real now)
      const apiHistory = nextMessages
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiHistory,
          itemName: item.name,
          currencyCode: currency.code,
          currencySymbol: currency.symbol,
          region: currency.region,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
      };

      const finalMessages = [...nextMessages, assistantMsg];
      messagesRef.current = finalMessages;
      setMessages(finalMessages);

      if (data.decision) {
        const { decision: status, reason } = data.decision;
        setDecision({ status, reason });
        await updateItem(item.id!, {
          status: status as any,
          decisionReason: reason,
          chatHistory: finalMessages.map(({ role, content }) => ({ role, content })),
        });
      } else {
        // Save chat progress
        await updateItem(item.id!, {
          chatHistory: finalMessages.map(({ role, content }) => ({ role, content })),
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'The signal was lost. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || decision) return;
    sendMessage(input.trim());
  };

  const handleClose = async () => {
    if (decision) {
      onComplete();
    }
    onClose();
  };

  const renderDecisionIcon = (status: string) => {
    switch (status) {
      case 'buy': return '✨';
      case 'repair': return '🛠️';
      case 'not_needed': return '🍃';
      default: return '💭';
    }
  };

  const renderDecisionLabel = (status: string) => {
    switch (status) {
      case 'buy': return 'SPEND';
      case 'repair': return 'REPAIR / UPGRADE';
      case 'not_needed': return 'SAVE';
      default: return status.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Reflecting on: {item.name}</h2>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {decision ? (
          <div className={styles.decisionPanel}>
            <div className={styles.decisionIcon}>{renderDecisionIcon(decision.status)}</div>
            <h3 className={styles.decisionTitle}>{renderDecisionLabel(decision.status)}</h3>
            <p className={styles.decisionReason}>{decision.reason}</p>
            <button className="btn btn-primary" onClick={handleClose} style={{ marginTop: '2rem' }}>
              Return to Journey
            </button>
          </div>
        ) : (
          <>
            <div className={styles.chatArea}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.role === 'user' ? styles.userMessage : styles.assistantMessage}
                >
                  {m.content}
                </div>
              ))}

              {isLoading && (
                <div className={styles.assistantMessage}>
                  <span className={styles.typingIndicator}>
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className={styles.inputArea}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share your thoughts…"
                disabled={isLoading}
                autoFocus
                aria-label="Your message"
              />
              <button type="submit" className="btn btn-primary" disabled={isLoading || !input.trim()}>
                {isLoading ? '…' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
