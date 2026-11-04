'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { MessageCircle, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { ChatMessage } from '@/lib/live/chat';

export default function BroadcastChat({
  messages,
  connected,
  send,
}: {
  messages: ChatMessage[];
  connected: boolean;
  send: (nickname: string, text: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [nickname, setNickname] = useState('');
  const [draftName, setDraftName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const nicknameId = useId();
  const follow = useRef(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('live-chat-nickname') ?? '';
      if (saved.trim() && [...saved].length <= 24) {
        setNickname(saved);
        setDraftName(saved);
      }
    } catch {
      /* Chat also works when storage is disabled. */
    }
  }, []);
  useEffect(() => {
    if (follow.current && list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [messages]);
  useEffect(() => {
    const element = list.current!;
    const observer = new ResizeObserver(() => {
      if (follow.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={list}
        role="log"
        aria-label="Broadcast chat messages"
        aria-live="polite"
        onScroll={() => {
          const el = list.current!;
          follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        className="h-72 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 lg:h-0 lg:flex-1"
      >
        {!messages.length && (
          <div className="px-3 py-8 text-center text-muted-foreground">
            <MessageCircle className="mx-auto mb-3 size-5" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Be the first to say hello</p>
            <p className="mt-2 text-xs">Chat with viewers of this broadcast.</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className="mb-3 text-xs leading-5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate font-semibold text-emerald-500" title={message.nickname}>
                {message.nickname}
              </span>
              <time
                className="shrink-0 font-mono text-[10px] text-muted-foreground"
                dateTime={new Date(message.sentAt).toISOString()}
              >
                {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}
              </time>
            </div>
            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text}</p>
          </div>
        ))}
      </div>
      <div className="border-t p-3">
        {nickname ? (
          <>
            <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="truncate">
                Chatting as <span className="font-medium text-foreground">{nickname}</span>
              </span>
              <button
                type="button"
                className="shrink-0 underline underline-offset-2"
                onClick={() => {
                  setDraftName(nickname);
                  setNickname('');
                }}
              >
                Change
              </button>
            </div>
            <form
              className="flex gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!text.trim() || sending) return;
                setSending(true);
                setError('');
                try {
                  const result = await send(nickname, text);
                  if (result.ok) setText('');
                  else setError(result.error ?? 'Message could not be sent.');
                } catch {
                  setError('Message could not be sent. Try again.');
                } finally {
                  setSending(false);
                }
              }}
            >
              <input
                aria-label="Message"
                placeholder={connected ? 'Say something…' : 'Reconnecting…'}
                maxLength={500}
                value={text}
                onChange={(event) => setText(event.target.value)}
                disabled={!connected}
                className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs focus-visible:outline-2 focus-visible:outline-ring"
              />
              <Button
                type="submit"
                size="icon"
                className="size-9 shrink-0"
                aria-label="Send message"
                disabled={!connected || sending || !text.trim()}
              >
                <Send className="size-3.5" />
              </Button>
            </form>
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const name = draftName.trim();
              if (!name || [...name].length > 24 || /[\p{Cc}\p{Cf}]/u.test(name)) {
                setError('Choose a nickname of 1–24 characters.');
                return;
              }
              setNickname(name);
              setError('');
              try {
                localStorage.setItem('live-chat-nickname', name);
              } catch {
                /* Optional preference. */
              }
            }}
          >
            <label className="mb-2 block text-xs font-medium" htmlFor={nicknameId}>
              Choose a nickname to chat
            </label>
            <div className="flex gap-2">
              <input
                id={nicknameId}
                autoComplete="nickname"
                maxLength={24}
                placeholder="Your nickname"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs focus-visible:outline-2 focus-visible:outline-ring"
              />
              <Button type="submit" size="sm" className="h-9" disabled={!draftName.trim()}>
                Join
              </Button>
            </div>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
