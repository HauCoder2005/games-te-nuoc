# Quyết định trong lúc code

Mỗi dòng: `YYYY-MM-DD · Task N · quyết định · lý do`.
2026-11-26 · Task 2 · Thùng ở bè 26×8 vẫn hoạt động và chìm khi bè co xuống 24×6 · Spec yêu cầu ô 16×16 nằm trọn trong bè; ở 26×8 cả bốn ô vẫn nằm trọn, khác kỳ vọng test trong plan.
2026-11-26 · Task 6 · BotMemory lưu input hiện tại giữa các lần phản xạ; bot chỉ xét húc khi cách địch dưới 35px với xác suất 8% mỗi quyết định · Spec không chốt ngưỡng hay xác suất húc và bot cần giữ hướng đi giữa các lần phản xạ.
2026-11-26 · Task 6 · Giảm KB_DIRECT/KB_SPLASH/KB_DASH xuống 85/55/120 · 20 trận bot với số khởi đầu chỉ dài trung bình 132,2 giây; sau chỉnh đạt 183,7 giây và 15/20 trận cách nhau tối đa 3 điểm.
2026-11-26 · Task 7 · Dùng các câu “Thao tác quá nhanh”, “Chỉ chủ phòng được làm việc này”, “Yêu cầu không hợp lệ” cho ba mã lỗi chưa có câu trong spec · Cần trả lỗi ngắn bằng tiếng Việt cho đủ ErrorCode của plan.
2026-11-26 · Task 9 · `killFeedLine` nhận thêm bản đồ đội tùy chọn để tô tên đúng phe · GameEvent `fall` và bản đồ tên không chứa đội, dù spec yêu cầu tô tên theo đội.
2026-11-26 · Task 10 · Build server bằng esbuild thành Node ESM, gộp mã shared; chạy Vitest bằng thread pool · Shared dùng module resolution bundler, còn khung Colyseus sinh sẵn dùng NodeNext và gửi tín hiệu process.send gây xung đột với fork của Vitest.
2026-11-26 · Task 11 · Tạo mã phòng bằng `crypto.randomInt` và giữ tập mã đang cấp phát trong tiến trình · Mã riêng cần khó đoán và tránh hai lời gọi đồng thời nhận cùng mã trước khi Presence kịp lưu.
2026-11-26 · Task 12 · `buildRoster` trả thêm tên trên mỗi `RosterEntry` · Kiểu `RosterEntry` trong plan không có tên dù bot cần tên để hiện ở sảnh và trong trận.
2026-11-26 · Task 13 · Thêm tên, đội, biến thể và cờ bot vào `GamePlayer` Schema · Client cần các thuộc tính này để vẽ đồng phục, tên đồng đội và bot sau khi nhận trạng thái trận.
2026-11-26 · Task 14 · Dùng nội suy và dự đoán vị trí dự phòng thay cho `@colyseus/sdk` Predictor · SDK Predictor cần trạng thái và thao tác xác nhận riêng, trong khi server đang gửi Schema cùng `ackSeq` theo giao thức đã định; lớp dự phòng khớp ngay với dữ liệu này.
2026-11-26 · Task 16 · Giới hạn phòng riêng ở `onAuth` của người tạo, lấy `AuthContext.ip`; giữ chỗ khi rớt mạng bằng `onDrop` · Colyseus 0.18 chỉ cung cấp IP lúc xác thực kết nối sau `onCreate`, và phân biệt `onDrop` với `onLeave` tự nguyện.
