# TÉ NƯỚC! 💦

Game web nhiều người: hai đội Đỏ và Xanh ném bóng nước, đẩy nhau văng khỏi chiếc bè giữa hồ bơi sân thượng. Đội nào đủ 10 điểm trước thì thắng.

- Thiết kế: `docs/design.md` (mockup: `docs/mockup.png`)
- Kế hoạch code: `docs/superpowers/plans/2026-11-26-te-nuoc.md`
- Hướng dẫn cho Codex: `AGENTS.md`, prompt dán vào Codex: `CODEX_PROMPT.md`
- Asset có sẵn: `apps/client/public/assets/`

Kiến trúc: `packages/shared` (luật game) · `apps/server` (Colyseus 0.18) · `apps/client` (Vite + Canvas) · client lên S3 + CloudFront, server lên máy AWS Singapore.
