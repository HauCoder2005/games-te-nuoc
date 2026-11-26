# Prompt dán vào Codex

> Mở Codex trong thư mục `te-nuoc/` này (hoặc đẩy thư mục lên một repo GitHub rồi trỏ Codex vào repo đó). Cần bật **quyền truy cập mạng** để `npm install` chạy được. Sau đó dán nguyên khối dưới đây.

---

Bạn là kỹ sư full-stack TypeScript. Nhiệm vụ: xây dựng game web nhiều người **"TÉ NƯỚC!"**, gồm luật game, **server game Colyseus 0.18** và client Canvas, đúng theo tài liệu trong repo này.

**Đọc trước khi viết dòng code nào:**
1. `AGENTS.md`: quy ước bắt buộc.
2. `docs/design.md`: spec, là nguồn sự thật cho mọi quyết định.
3. `docs/superpowers/plans/2026-11-26-te-nuoc.md`: kế hoạch 21 task chia 5 cột mốc (M1–M5).
4. `docs/mockup.png` và `docs/nhan-vat.png`: giao diện và đồng phục mẫu.

**Những gì phải có:**
- Server riêng chạy nhiều phòng cùng lúc. Server tính toàn bộ luật game; client chỉ gửi input.
- **Phòng riêng**: người chơi bấm "Tạo phòng riêng" và nhận mã 4 chữ (ví dụ `KHVT`) cùng link `#/r/KHVT`. Bạn bè nhập mã để vào. Phòng riêng **không bao giờ** bị ghép ngẫu nhiên vào.
- **Ghép ngẫu nhiên**: bấm nút thì vào phòng chờ công khai và màn hình hiện "Đang tìm người chơi… n/10". Mọi người bấm **Bắt đầu** để báo sẵn sàng; đủ điều kiện thì đếm ngược rồi xếp trận 5v5, chỗ trống lấp bằng bot. Luật cụ thể ở spec mục 6.2: có người treo máy thì phòng vẫn không bị kẹt.
- **Chơi thử với bot** offline, không cần server.

**Cách làm:**
- Làm **đúng thứ tự task** trong plan. Mỗi task theo nhịp: viết test → chạy thấy FAIL → code → chạy thấy PASS → commit một commit. Tick `- [x]` vào plan khi xong từng bước.
- Ở các bước "Kiểm tra tay" mà không tự mở trình duyệt được: viết thêm một test tự động bao phủ đúng kịch bản đó, rồi ghi vào `docs/decisions.md` rằng bước tay cần người kiểm tra lại.
- Spec không nói rõ thì tự quyết phương án đơn giản nhất phù hợp spec, và ghi một dòng vào `docs/decisions.md`. Không hỏi lại trừ khi bị chặn hoàn toàn.
- Colyseus 0.18: đọc docs đúng phiên bản đã cài. Tên API trong plan là ý đồ; API thật khác tên thì dùng API tương đương, giữ đúng hành vi và test.
- Không vẽ lại asset trong `apps/client/public/assets/`. Thiếu thứ gì thì vẽ hình tròn màu đội thay thế.
- Không thêm tính năng ngoài spec: không đăng nhập, không chat, không bảng xếp hạng.

**Báo cáo sau mỗi cột mốc (M1…M5):**
- Danh sách task đã xong.
- Kết quả `npm test` và `npm run build`.
- Các quyết định mới trong `docs/decisions.md`.
- Phần nào còn cần người kiểm tra bằng tay.

Sau đó làm tiếp cột mốc kế tiếp, không cần chờ.

**Hoàn thành khi:**
- `npm test` và `npm run build` ở thư mục gốc đều xanh.
- `docker compose -f infra/docker-compose.yml build` chạy được.
- Đã đi hết mục "Kiểm tra cuối" của plan.
- Có `docs/deploy.md` hướng dẫn đưa client lên S3 + CloudFront và server lên máy AWS Singapore.
