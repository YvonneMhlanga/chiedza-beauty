'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Send, ArrowLeft } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { api, assetUrl, type Conversation, type Message, type ChatUser } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';

const IMG_LINE =
  /^(https?:\/\/\S+\.(jpe?g|png|webp|gif)|\/uploads\/\S+\.(jpe?g|png|webp|gif)|\/api\/uploads\/file\/[\w-]+)$/i;

// Split a message body so lines that are just an image URL render as a thumbnail.
function renderBody(body: string) {
  const lines = body.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (IMG_LINE.test(trimmed)) {
      const src = assetUrl(trimmed);
      return (
        <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img src={src} alt="Attachment" className="max-w-[180px] rounded-lg" />
        </a>
      );
    }
    return (
      <span key={i} className="block whitespace-pre-wrap break-words">
        {line || ' '}
      </span>
    );
  });
}

function timeLabel(iso: string) {
  const d = new Date(iso.includes('T') || iso.includes('Z') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function MessagesInner() {
  const params = useSearchParams();
  const startWith = params.get('to');

  const [token, setToken] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'signedout'>('loading');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();
    if (!t || !u) {
      setStatus('signedout');
      return;
    }
    setToken(t);
    setMeId(u.id);
    setStatus('ready');
    if (startWith) setActiveId(startWith);
  }, [startWith]);

  const loadConversations = useCallback(() => {
    if (!token) return;
    api.getConversations(token).then(setConversations).catch(() => {});
  }, [token]);

  const loadThread = useCallback(
    (id: string) => {
      if (!token) return;
      api
        .getThread(token, id)
        .then((r) => {
          setActiveUser(r.user);
          setMessages(r.messages);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Could not load conversation'));
    },
    [token]
  );

  useEffect(() => {
    if (status === 'ready') loadConversations();
  }, [status, loadConversations]);

  // Load + poll the open thread
  useEffect(() => {
    if (!activeId || !token) return;
    loadThread(activeId);
    const id = setInterval(() => {
      loadThread(activeId);
      loadConversations();
    }, 5000);
    return () => clearInterval(id);
  }, [activeId, token, loadThread, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !token || !activeId) return;
    setSending(true);
    setError(null);
    try {
      const msg = await api.sendMessage(token, activeId, body);
      setMessages((m) => [...m, msg]);
      setText('');
      loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-gray-500">Loading messages…</p>
      </div>
    );
  }

  if (status === 'signedout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="text-center">
          <h1 className="text-3xl font-black text-primary mb-3">Sign in to see your messages</h1>
          <p className="text-gray-600 mb-6">Chat with braiders and clients once you are signed in.</p>
          <Link href="/auth/login" className="btn-primary inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const showListOnMobile = !activeId;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-primary mb-6">Messages</h1>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden grid md:grid-cols-[300px_1fr] h-[70vh]">
          {/* Conversation list */}
          <aside
            className={`border-r border-gray-100 overflow-y-auto ${
              showListOnMobile ? 'block' : 'hidden md:block'
            }`}
          >
            {conversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No conversations yet. Open a braider&apos;s profile and tap “Message”.
              </p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.otherId}
                  onClick={() => setActiveId(c.otherId)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 hover:bg-cream transition ${
                    activeId === c.otherId ? 'bg-cream' : ''
                  }`}
                >
                  <Avatar
                    src={assetUrl(c.user.profileImage) || undefined}
                    name={c.user.name}
                    className="w-11 h-11 flex-shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-bold text-primary text-sm truncate">{c.user.name}</span>
                      <span className="text-[0.65rem] text-gray-400 flex-shrink-0">
                        {timeLabel(c.lastAt)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500 truncate">{c.lastMessage}</span>
                      {c.unread > 0 && (
                        <span className="bg-accent text-white text-[0.6rem] font-black rounded-full px-1.5 py-0.5 flex-shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </aside>

          {/* Thread */}
          <section className={`flex flex-col ${showListOnMobile ? 'hidden md:flex' : 'flex'}`}>
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation
              </div>
            ) : (
              <>
                <header className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => setActiveId(null)}
                    className="md:hidden text-gray-500"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar
                    src={assetUrl(activeUser?.profileImage) || undefined}
                    name={activeUser?.name || 'User'}
                    className="w-9 h-9"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-primary text-sm truncate">
                      {activeUser?.name || 'Conversation'}
                    </p>
                    {activeUser?.userType && (
                      <p className="text-[0.65rem] text-gray-400 uppercase tracking-wide">
                        {activeUser.userType}
                      </p>
                    )}
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-cream/40">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-gray-400 mt-6">
                      Say hello — start the conversation.
                    </p>
                  )}
                  {messages.map((m) => {
                    const mine = m.fromUserId === meId;
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                            mine
                              ? 'bg-primary text-white rounded-br-sm'
                              : 'bg-white border border-gray-100 text-primary rounded-bl-sm'
                          }`}
                        >
                          <div>{renderBody(m.body)}</div>
                          <p
                            className={`text-[0.6rem] mt-1 ${
                              mine ? 'text-blue-200' : 'text-gray-400'
                            }`}
                          >
                            {timeLabel(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {error && (
                  <p className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
                    {error}
                  </p>
                )}

                <form onSubmit={send} className="p-3 border-t border-gray-100 flex items-center gap-2">
                  <input
                    className="input-base flex-1"
                    placeholder="Write a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="btn-primary p-3 disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <p className="text-gray-500">Loading messages…</p>
        </div>
      }
    >
      <MessagesInner />
    </Suspense>
  );
}
