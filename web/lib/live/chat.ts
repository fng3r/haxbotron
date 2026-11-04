import { randomUUID } from 'node:crypto';

export type ChatMessage = { id: string; ruid: string; nickname: string; text: string; sentAt: number };
export type ChatResult = { ok: true; message: ChatMessage } | { ok: false; error: string };

// Bounded room history shared by viewers connected to the web HTTP server.
export class LiveChat {
  private rooms = new Map<string, ChatMessage[]>();
  private senders = new Map<string, number>();

  history(ruid: string): ChatMessage[] {
    return this.rooms.get(ruid)?.slice() ?? [];
  }

  send(ruid: string, sender: string, payload: unknown, now = Date.now()): ChatResult {
    if (!payload || typeof payload !== 'object') return { ok: false, error: 'Invalid message.' };
    const { nickname, text } = payload as { nickname?: unknown; text?: unknown };
    if (
      typeof nickname !== 'string' ||
      !nickname.trim() ||
      [...nickname.trim()].length > 24 ||
      /[\p{Cc}\p{Cf}]/u.test(nickname)
    )
      return { ok: false, error: 'Choose a nickname of 1–24 characters.' };
    if (typeof text !== 'string' || !text.trim() || [...text.trim()].length > 500 || /[\p{Cc}\p{Cf}]/u.test(text))
      return { ok: false, error: 'Messages must contain 1–500 characters on one line.' };
    if (now - (this.senders.get(sender) ?? -Infinity) < 1000)
      return { ok: false, error: 'Wait a second before sending another message.' };
    for (const [key, time] of this.senders) if (now - time >= 1000) this.senders.delete(key);
    if (this.senders.size >= 10000) return { ok: false, error: 'Chat is busy. Try again shortly.' };
    this.senders.set(sender, now);
    const message = { id: randomUUID(), ruid, nickname: nickname.trim(), text: text.trim(), sentAt: now };
    const history = [...this.history(ruid), message].slice(-100);
    this.rooms.delete(ruid);
    this.rooms.set(ruid, history);
    if (this.rooms.size > 500) this.rooms.delete(this.rooms.keys().next().value!);
    return { ok: true, message };
  }
}
