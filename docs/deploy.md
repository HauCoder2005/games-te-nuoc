# Triển khai Aqua Blast — Lựa chọn 3 (Frontend trên CDN + Backend trên Cloud)

Kiến trúc này tách riêng **Web Client (Frontend)** lên mạng CDN toàn cầu (Cloudflare Pages / Vercel / Netlify / AWS S3+CloudFront) để tải trang tức thì cho hàng ngàn người, và **Game Server (Colyseus WebSocket + API)** lên Cloud Server tại **Singapore** để độ trễ (ping) thấp nhất cho người chơi tại Việt Nam.

---

## Bước 1: Đẩy code lên GitHub
```bash
git remote add origin https://github.com/<tai-khoan-cua-ban>/aqua-blast.git
git push -u origin master
```

---

## Bước 2: Deploy Backend (Game Server Colyseus) — Lấy link `wss://`

Bảng xếp hạng được lưu trong `/app/data/accounts.json`. VPS Docker Compose đã gắn volume `account_data`; với Railway, Render hoặc Fly.io, cần gắn persistent volume vào `/app/data` và đặt `ACCOUNT_DATA_FILE=/app/data/accounts.json` để điểm không mất khi khởi động lại.

Repo đã có sẵn cấu hình tự động cho **Railway**, **Render (Singapore)**, **Fly.io (Singapore)** và **VPS Docker (AWS Singapore)**. Bạn chỉ cần chọn **1** trong các dịch vụ dưới đây:

### Cách 2A — Railway.app hoặc Render.com (Không cần gõ lệnh)
1. Vào **Railway.app** (hoặc **Render.com** → *New Blueprint / Web Service*).
2. Chọn repo GitHub `aqua-blast` (hệ thống tự nhận [railway.json](../railway.json) hoặc [render.yaml](../render.yaml) và build từ [infra/server.Dockerfile](../infra/server.Dockerfile)).
3. Sau khi deploy xong, copy domain của Backend (ví dụ: `aqua-blast-server.up.railway.app` hoặc `aqua-blast-server.onrender.com`).
   - Kiểm tra mở `https://<domain-backend>/health` thấy `{"ok":true,"rooms":0,"clients":0}` là thành công.
   - Địa chỉ WebSocket của bạn là: **`wss://<domain-backend>`**.

### Cách 2B — Fly.io (Datacenter Singapore `sin`, cấu hình sẵn 1.000 kết nối/máy)
Đã có sẵn file [fly.toml](../fly.toml):
```bash
fly auth login
fly launch --copy-config --name aqua-blast-api --region sin
fly deploy
```
Địa chỉ WebSocket của bạn sẽ là: **`wss://aqua-blast-api.fly.dev`**.

### Cách 2C — VPS riêng (AWS Lightsail / EC2 Singapore / DigitalOcean)
1. Trỏ tên miền `api.ten-mien-cua-ban.com` về IP VPS (mở cổng 80, 443).
2. Trên VPS:
   ```bash
   cp infra/.env.example infra/.env
   # Sửa SERVER_DOMAIN=api.ten-mien-cua-ban.com và ALLOWED_ORIGIN=*
   docker compose --env-file infra/.env -f infra/docker-compose.yml up -d --build
   ```
   Địa chỉ WebSocket của bạn sẽ là: **`wss://api.ten-mien-cua-ban.com`**.

---

## Bước 3: Deploy Frontend (Web Client) lên CDN
Sau khi có link `wss://<domain-backend>` ở Bước 2, bạn deploy Frontend lên CDN:

### Cách 3A — Vercel hoặc Netlify (Đã có sẵn `vercel.json` và `netlify.toml`)
1. Vào **Vercel.com** hoặc **Netlify.com** → **Import Git Repository** → chọn repo `aqua-blast`.
2. Hệ thống tự động nhận lệnh build từ [vercel.json](../vercel.json) hoặc [netlify.toml](../netlify.toml) (`apps/client/dist`).
3. Trong mục **Environment Variables**, thêm **1 biến duy nhất**:
   - Key: `VITE_SERVER_URL`
   - Value: `wss://<domain-backend>` *(link lấy từ Bước 2)*
4. Bấm **Deploy** → Nhận link game (ví dụ `https://aqua-blast.vercel.app`) và gửi cho mọi người chơi!

### Cách 3B — Cloudflare Pages
1. Vào **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
2. Cấu hình Build:
   - **Build command**: `npm run build -w @te-nuoc/shared && npm run build -w @te-nuoc/client`
   - **Build output directory**: `apps/client/dist`
   - **Environment variable**: `VITE_SERVER_URL = wss://<domain-backend>`
3. Bấm **Save and Deploy**.

### Cách 3C — AWS S3 + CloudFront
Chạy script có sẵn [infra/deploy-client.sh](../infra/deploy-client.sh):
```bash
BUCKET=ten-s3-bucket \
CF_DISTRIBUTION_ID=E1234567890 \
VITE_SERVER_URL=wss://<domain-backend> \
./infra/deploy-client.sh
```
