import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LiveChat } from './chat.ts';

test('chat validates nicknames and messages before accepting them', () => {
  const chat = new LiveChat();
  for (const payload of [
    null,
    {},
    { nickname: '', text: 'Hi' },
    { nickname: 'a'.repeat(25), text: 'Hi' },
    { nickname: 'Viewer', text: ' ' },
    { nickname: 'Viewer', text: 'x'.repeat(501) },
    { nickname: 'Viewer\nAdmin', text: 'Hi' },
    { nickname: 'Viewer', text: 'Hi\u202e' },
  ]) {
    assert.equal(chat.send('a', 'sender', payload).ok, false);
  }
  assert.deepEqual(chat.history('a'), []);
  const result = chat.send('a', 'sender', { nickname: ' Viewer ', text: ' Hi <script> ' });
  assert.equal(result.ok, true);
  assert.equal(result.message.nickname, 'Viewer');
  assert.equal(result.message.text, 'Hi <script>'); // Rendered as text by React.
});

test('history is isolated by room, bounded and rate limited per sender', () => {
  const chat = new LiveChat();
  const payload = { nickname: 'Viewer', text: 'Hello' };
  assert.equal(chat.send('a', 'sender', payload, 1000).ok, true);
  assert.equal(chat.send('a', 'sender', payload, 1500).ok, false);
  assert.equal(chat.send('a', 'other', payload, 1500).ok, true);
  assert.equal(chat.send('a', 'sender', payload, 2000).ok, true);
  assert.deepEqual(chat.history('b'), []);
  for (let i = 0; i < 110; i++) chat.send('a', 'sender', { ...payload, text: String(i) }, 3000 + i * 1000);
  const history = chat.history('a');
  assert.equal(history.length, 100);
  assert.equal(history[0].text, '10');
  history.pop();
  assert.equal(chat.history('a').length, 100);
});
