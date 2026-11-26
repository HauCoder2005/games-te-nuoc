# Triển khai TÉ NƯỚC!

## Server tại AWS Singapore

1. Tạo EC2 hoặc Lightsail Ubuntu tại `ap-southeast-1`, gắn IP tĩnh. Mở TCP 22 cho quản trị, 80 và 443 cho người chơi.
2. Trỏ bản ghi A của `game-api.example.com` đến IP đó. Cài Docker Engine kèm Compose plugin và Git trên máy.
3. Clone repo vào thư mục triển khai. Chép `infra/.env.example` thành `infra/.env`, đặt `SERVER_DOMAIN`, `ALLOWED_ORIGIN` là URL CloudFront của client và mật khẩu quản trị riêng. Không commit `.env`.
4. Chạy `docker compose --env-file infra/.env -f infra/docker-compose.yml up -d --build`. Caddy tự lấy chứng chỉ TLS cho tên miền thật; kiểm tra `https://game-api.example.com/health` trả `ok`, `rooms`, `clients`.
5. Các lần sau đặt `SERVER_HOST`, `SERVER_USER`, `SERVER_DIR` rồi chạy `infra/deploy-server.sh` từ máy quản trị. Script chạy `git pull --ff-only` và cập nhật Compose.

## Client trên S3 và CloudFront

1. Tạo S3 bucket private tại Singapore, tắt public access. Tạo CloudFront distribution với S3 origin và Origin Access Control (OAC), cấp bucket policy đọc cho distribution. Đặt default root object `index.html` và custom error 403/404 trả `/index.html` cho route SPA.
2. Tạo AWS CLI credentials có quyền ghi bucket và tạo invalidation. Trên máy build đặt `BUCKET`, `CF_DISTRIBUTION_ID`, `VITE_SERVER_URL=wss://game-api.example.com`.
3. Chạy `infra/deploy-client.sh`. Script build Vite, sync file tĩnh, đặt cache dài cho file có hash, `no-cache` cho `index.html`, rồi invalidation `/index.html`.
4. Mở URL CloudFront. Client dùng WebSocket TLS tới server; `ALLOWED_ORIGIN` của server phải khớp origin CloudFront.
