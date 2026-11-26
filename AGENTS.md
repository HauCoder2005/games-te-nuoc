# AGENTS.md — hướng dẫn cho agent code (Codex)

## Dự án
"TÉ NƯỚC!" là game web nhiều người. Hai đội Đỏ và Xanh ném bóng nước để đẩy nhau khỏi chiếc bè giữa hồ bơi, đội nào đủ 10 điểm trước thì thắng. Có server riêng, phòng riêng bằng mã 4 chữ và chế độ ghép ngẫu nhiên.

## Đọc theo thứ tự trước khi code
1. `docs/design.md`: tài liệu thiết kế, là nguồn sự thật cho mọi quyết định.
2. `docs/superpowers/plans/2026-11-26-te-nuoc.md`: kế hoạch từng task. **Làm đúng thứ tự task.**
3. `docs/mockup.png`, `docs/nhan-vat.png`: hình mẫu giao diện và đồng phục.
4. `apps/client/public/assets/manifest.json`: asset đã có sẵn.

## Cách làm việc
- Thư mục chưa là git repo thì chạy `git init` và commit toàn bộ trạng thái ban đầu trước Task 1.
- Mỗi task: viết test → chạy thấy FAIL → code → chạy thấy PASS → commit (mỗi task một commit, message theo plan). Đánh dấu `- [x]` trong file plan khi xong từng bước.
- Không thêm tính năng ngoài spec. Nếu phải tự quyết một điều spec không nói, ghi một dòng vào `docs/decisions.md` (ngày, task, quyết định, lý do).
- Nếu spec và plan lệch nhau, **spec thắng**. Ghi lại vào `docs/decisions.md`.
- Colyseus: dùng **0.18**. Đọc docs đúng phiên bản đã cài trước khi viết code server/SDK. Tên hàm trong plan là ý đồ; API thực tế khác tên thì dùng API tương đương và giữ đúng hành vi.

## Quy ước bắt buộc
- TypeScript strict, ESM, npm workspaces. Không dùng `any` trừ ở ranh giới dữ liệu chưa kiểm tra (sau đó phải kiểm tra bằng `validateInput` hoặc type guard).
- `packages/shared/src/sim/**`: không DOM, không mạng, không `Date`, không `Math.random`. Mọi số ngẫu nhiên lấy từ RNG có seed.
- Mọi hằng số nằm trong `packages/shared/src/config.ts`.
- Chữ trên giao diện bằng tiếng Việt, dùng đúng các câu trong spec. Font VT323.
- Tên người chơi chỉ hiển thị qua `textContent` hoặc canvas, **không bao giờ** qua `innerHTML`.
- Không vẽ lại hay thay asset trong `apps/client/public/assets/`. Thiếu asset thì vẽ hình tròn màu đội thay thế.

## Lệnh thường dùng
```bash
npm install                 # ở thư mục gốc
npm test                    # chạy test mọi workspace
npm run dev:server          # Colyseus ở ws://localhost:2567
npm run dev:client          # Vite ở http://localhost:5173
npm run tune -w packages/shared   # thống kê 20 trận toàn bot
npm run build
```

## Hoàn thành nghĩa là
- `npm test` và `npm run build` đều xanh.
- Đi hết mục "Kiểm tra cuối" trong plan.
- Có `docs/decisions.md` liệt kê các quyết định tự đưa ra.
