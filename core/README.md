# Haxbotron Core 🤖
## What is this
`haxbotron-core` is a Game Server for `Haxbotron`.

## Donate
Please donate and support this project by [Patreon](https://www.patreon.com/dapucita) !

위 페이지에서 기부하여 이 프로젝트를 지원해주세요!

## How to Start
You need to install dependencies if you didn't.

You don't have to build again if you did it already unless any changes made.

_Set `.env` is strongly recommended before launch this server._

```
npm install
npm run build
npm start
```

If room startup logs show TLS handshake stalls and a direct Node HTTPS test succeeds
with `ecdhCurve: 'X25519'`, add this to `core/.env` and restart the core server:

```dotenv
ROOM_TLS_ECDH_CURVE=X25519
```

This selects the TLS key-exchange group for connections inside room worker
processes, including HaxBall HTTP and WebSocket connections. It preserves TLS 1.3
and certificate verification. Leave it unset to use Node/OpenSSL defaults.

## Contacts
- [Github](https://github.com/dapucita/haxbotron)
- [Discord](https://discord.gg/qfg45B2)

## Copyrights
By `dapucita`, MIT License.
