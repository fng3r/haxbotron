'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { MessageCircle, Send } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { ChatMessage } from '@/lib/live/chat';

const nicknameColors = [
  'text-emerald-700 dark:text-emerald-400',
  'text-sky-700 dark:text-sky-400',
  'text-amber-700 dark:text-amber-400',
  'text-rose-700 dark:text-rose-400',
  'text-violet-700 dark:text-violet-400',
  'text-teal-700 dark:text-teal-400',
  'text-orange-700 dark:text-orange-400',
  'text-fuchsia-700 dark:text-fuchsia-400',
  'text-lime-700 dark:text-lime-400',
  'text-indigo-700 dark:text-indigo-400',
  'text-cyan-700 dark:text-cyan-400',
  'text-pink-700 dark:text-pink-400',
];

function nicknameColor(nickname: string): string {
  let hash = 2166136261;
  for (const character of nickname.trim().normalize('NFC').toLowerCase()) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  }
  return nicknameColors[(hash >>> 0) % nicknameColors.length];
}

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
        data-broadcast-scroll
        role="log"
        aria-label="Broadcast chat messages"
        aria-live="polite"
        onScroll={() => {
          const el = list.current!;
          follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        className="h-72 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 lg:h-0 lg:flex-1"
      >
        <div className="flex min-h-full flex-col justify-end">
          {!messages.length && (
            <div className="px-3 py-8 text-center text-muted-foreground">
              <MessageCircle className="mx-auto mb-3 size-5" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">Be the first to say hello</p>
              <p className="mt-2 text-xs">Chat with viewers of this broadcast.</p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className="mb-3 shrink-0 text-xs leading-5">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`min-w-0 truncate font-semibold ${nicknameColor(message.nickname)}`}
                  title={message.nickname}
                >
                  {message.nickname}
                </span>
                <time
                  className="shrink-0 font-mono text-[10px] text-muted-foreground"
                  dateTime={new Date(message.sentAt).toISOString()}
                >
                  {new Date(message.sentAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hourCycle: 'h23',
                  })}
                </time>
              </div>
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t p-3">
        {nickname ? (
          <>
            <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="truncate">
                Chatting as <span className={`font-medium ${nicknameColor(nickname)}`}>{nickname}</span>
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto shrink-0 p-0 text-[11px] font-normal text-muted-foreground underline underline-offset-2"
                onClick={() => {
                  setDraftName(nickname);
                  setNickname('');
                }}
              >
                Change
              </Button>
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
              <Input
                aria-label="Message"
                placeholder={connected ? 'Say something…' : 'Reconnecting…'}
                maxLength={500}
                value={text}
                onChange={(event) => setText(event.target.value)}
                disabled={!connected}
                className="h-9 min-w-0 flex-1 bg-background px-2 text-xs md:text-xs"
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
            <Label className="mb-2 block text-xs font-medium" htmlFor={nicknameId}>
              Choose a nickname to chat
            </Label>
            <div className="flex gap-2">
              <Input
                id={nicknameId}
                autoComplete="nickname"
                maxLength={24}
                placeholder="Your nickname"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                className="h-9 min-w-0 flex-1 bg-background px-2 text-xs md:text-xs"
              />
              <Button type="submit" size="sm" className="h-9" disabled={!draftName.trim()}>
                Join
              </Button>
            </div>
          </form>
        )}
        {error && (
          <Alert variant="destructive" className="mt-2 px-2 py-1">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
