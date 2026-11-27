# TÉ NƯỚC! — Tài liệu thiết kế (bản 3: đấu đội + server riêng)

> Game web online, 2 đội × 4–5 người, ném bóng nước để đẩy đối thủ văng khỏi chiếc bè lớn giữa hồ bơi. Đội nào đẩy rơi đủ **10 lượt** trước thì thắng.
> Tài liệu này đủ để một người (hoặc Codex) lập kế hoạch và code mà không cần hỏi lại.
> Mọi con số ở mục 5 là **giá trị khởi đầu để tinh chỉnh** và phải nằm trong `packages/shared/src/config.ts`.

Ký hiệu: **[Bạn chốt]** = chủ dự án đã quyết. **[Đề xuất]** = người thiết kế quyết thay, có thể đổi.

---

## 1. Ý tưởng và lý do

- **[Bạn chốt]** Game online trên trình duyệt để một nhóm bạn (5 người trở lên) đánh nhau cho vui.
- **[Bạn chốt]** Lối chơi: ném bóng nước, bị trúng thì bị đẩy lùi, văng ra khỏi khu vực là mất lượt.
- **[Bạn chốt]** Chơi **theo đội, mỗi đội 4 hoặc 5 người**. Bản đồ **rộng hơn** bản đầu.
- **[Bạn chốt]** Đua tới **10 điểm** để trận đấu kịch tính.
- **[Bạn chốt]** Phần web (client) host trên **AWS S3**.
- **[Bạn chốt]** Có **server game riêng**, vì nhiều phòng và nhiều người chơi cùng lúc.
- **[Bạn chốt]** Hai cách vào trận:
  - **Nhập mã phòng** để vào **phòng riêng** chơi với nhau.
  - **Ghép ngẫu nhiên** ("thế giới"): bấm nút, chờ đủ 10 người thật rồi tự vào trận 5v5.
- **[Bạn chốt]** **Cả đội mặc chung một màu**: Đội Đỏ và Đội Xanh dương.
- **[Bạn chốt]** **Chỉ đồng đội mới hiện tên** trên đầu. Đối thủ không có tên.
- **[Bạn chốt]** Nhân vật pixel nhìn thẳng. Hai ảnh tham khảo (ảnh stock có watermark, và lính canh trong phim Squid Game) **không dùng**. Nhân vật trong game là **đồng phục đội tự thiết kế, nguyên bản**.
- **[Bạn chốt]** Bối cảnh do người thiết kế đề xuất. Codex sẽ code logic game từ tài liệu này.

**[Đề xuất] Cách hiểu "thang điểm 10"**: mỗi lần một người rơi xuống nước thì **đội kia được 1 điểm**. Người rơi **hồi sinh sau 3 giây** ở phía sân nhà. Đội nào tới 10 điểm trước thì thắng. Như vậy không ai phải ngồi chờ, tỉ số nhảy liên tục, và có những khoảnh khắc 9–9. (Phương án "thắng 10 ván" bị loại vì một trận sẽ dài hơn 20 phút.)

Thành công nghĩa là một nhóm bạn mở link, chia đội trong vòng 1 phút, chơi một trận 3–5 phút, hò hét lúc tỉ số sát nút, và muốn đấu lại.

## 2. Mục tiêu, không làm, và những thứ phải tránh

**Mục tiêu (v1)**
- 2 đội **Đỏ** và **Xanh**, đấu 4v4 hoặc 5v5. Phòng riêng có thể lấp chỗ trống bằng bot; ghép công khai cần đủ 10 người thật.
- **Phòng riêng**: tạo phòng, nhận **mã 4 chữ** / **link chia sẻ**, bạn bè nhập mã để vào. Không cần tài khoản.
- **Ghép ngẫu nhiên**: một nút bấm là vào phòng chờ công khai cùng người lạ; đủ 10 người thì tự vào trận, không lấp bot.
- Một server chạy được **nhiều phòng song song** (mục tiêu v1: ít nhất 50 phòng / 500 người trên một máy nhỏ).
- Một trận dài 3–5 phút, đua tới 10 điểm. Có giới hạn thời gian và **bàn thắng vàng**.
- Chạy trên Chrome, Edge, Firefox, Safari máy tính, điều khiển bằng bàn phím và chuột.
- Chi phí thấp: client trên S3 + CloudFront, server là **một máy ảo nhỏ ở Singapore** (gần Việt Nam nhất).
- Chơi thử một mình với bot, không cần server.

**Không làm trong v1** (để sau)
- Đăng nhập, lưu thành tích, bảng xếp hạng.
- Danh sách phòng để duyệt, xếp hạng theo trình độ (ELO), chọn khu vực server.
- Điều khiển cảm ứng trên điện thoại.
- Hơn 2 đội, hơn 10 người một phòng.
- Chạy nhiều server cùng lúc (Redis). Kiến trúc để sẵn đường nhưng v1 chỉ một máy.
- Chat chữ, voice chat, vật phẩm nhặt được.

**Phải tránh** (dù game chạy được cũng coi là hỏng)
- Vào phòng rườm rà: phải cài đặt hoặc qua quá 3 bước.
- Không phân biệt được ai phe mình, ai phe địch chỉ trong một cái liếc.
- Trúng đòn "oan": nhìn thấy bóng trượt mà vẫn bị đẩy. Hiệu ứng nổ phải hiện **đúng chỗ** server tính.
- Bị "canh điểm hồi sinh": vừa hồi sinh đã bị đẩy rơi ngay.
- Một người spam bóng là thắng. Đã có giới hạn bằng hệ thống đạn.
- Trận đấu hết hồi hộp vì một đội bỏ xa quá sớm.
- Phòng ghép ngẫu nhiên vào trận khi chưa đủ 10 người thật hoặc lấp bot vào chỗ trống.
- Mã phòng riêng bị người lạ đoán trúng rồi vào phá: phòng riêng **không bao giờ** xuất hiện trong ghép ngẫu nhiên.

## 3. Bối cảnh và bản đồ **[Đề xuất]**

**"Đại chiến té nước trên sân thượng"**. Sài Gòn tháng Tư, 38°C, lúc hoàng hôn. Trên sân thượng một chung cư cũ có hồ bơi. Hai phe kéo ra giữa hồ một **chiếc bè lớn ghép từ pallet gỗ và thùng phuy nhựa xanh**, rồi mở đại chiến bóng nước. Ai bị ném văng khỏi bè là "tõm" xuống hồ, rồi bơi về phía đội mình để leo lên lại.

Khung hình là góc nhìn **3/4 từ trên xuống** (kiểu Stardew Valley), nên nhân vật nhìn thẳng đứng trên sàn trông tự nhiên. Camera cố định và thấy toàn bộ bè, để cả phòng cùng nhìn một cảnh.

**Thế giới = màn hình**: tọa độ thế giới trùng tọa độ logic **640×360**, gốc (0, 0) ở góc trên trái.

| Lớp | Nội dung |
|---|---|
| Dải trời phía trên (y 0–51, không chơi được) | Trời hoàng hôn tím–hồng–cam, mặt trời lặn, hàng nhà cao tầng có cửa sổ sáng đèn, dây đèn trang trí, lan can và tường sân thượng |
| Sàn sân thượng | Gạch tàu đỏ cam. Đạo cụ ở hai bên hồ: ghế nhựa đỏ xếp chồng, thùng đá, chậu cây, khăn tắm, dép tổ ong, quạt đứng |
| Hồ bơi | Nước xanh có gợn sóng động (4 khung), viền gạch men trắng xanh, vạch bơi dưới đáy |
| Bè (đấu trường) | 32×14 ô ván gỗ. **Vạch giữa** chia sân. Hai đầu bè có **cờ đội** (đỏ bên trái, xanh bên phải) đánh dấu khu hồi sinh. Có **4 thùng xốp đựng đá** làm vật cản. Mép dưới tối màu để tạo độ dày, bọt trắng quanh mép |
| Hiệu ứng | Bóng nước theo màu đội, có bóng đổ dưới đất; nổ thành vòng giọt nước; người rơi làm bắn cột nước; ván sắp chìm thì nứt và nhấp nháy đỏ |

Bảng màu gợi ý:
- Nước `#1FA3D1`, gợn `#6FD6F0`, nước sâu `#1786B5`.
- Gỗ `#B07A47`, gỗ tối `#7A4E2A`, gạch tàu `#C96F4A`.
- Trời `#2B2D6E → #F2709C → #FFB35C`, viền đen tím `#2B1E2F`.
- **Đội Đỏ `#E53B3B`, Đội Xanh `#3B8BF0`.** Chỉ dùng hai màu này để báo phe, không dùng cho trang trí khác.

Ảnh `docs/mockup.png` là mockup một khoảnh khắc giữa trận. Ảnh `docs/nhan-vat.png` là đồng phục hai đội. Mockup vẽ theo góc nhìn của Tèo (Đội Đỏ): chỉ người Đội Đỏ có tên trên đầu.

### 3.1 Đồng phục đội **[Đề xuất]**

Mỗi người mặc **nón bơi + kính bơi + áo đấu và quần đùi màu đội**:
- Đội Đỏ: nón, áo đỏ `#E53B3B`, quần đỏ sẫm `#A82626`.
- Đội Xanh dương: nón, áo xanh `#3B8BF0`, quần xanh sẫm `#24589E`.
- Áo có một sọc trắng ngang ngực, quần có sọc trắng hai bên, dép trắng.

Trong một đội, 5 người khác nhau nhẹ ở **màu da, tóc lộ ra dưới nón và màu tròng kính** (5 kiểu, bảng `UNIFORM_VARIANTS`). Server tự gán kiểu theo thứ tự trong đội để không ai trùng. Người chơi **không chọn nhân vật**; danh tính là cái tên.

| Kiểu | Da | Tóc | Tròng kính |
|---|---|---|---|
| 0 | ngăm `#D9A06A` | đen | xanh nhạt |
| 1 | sáng `#F6D2B0` | nâu | vàng |
| 2 | đậm `#8D5524` | đen | xanh lá |
| 3 | trung bình `#E8B48A` | đen | hồng |
| 4 | sáng `#F6D2B0` | vàng | cam |

## 4. Luật chơi **[Đề xuất]**

### 4.1 Điều khiển (bàn phím + chuột)

| Phím | Hành động |
|---|---|
| WASD / phím mũi tên | Di chuyển 8 hướng |
| Chuột | Ngắm. Nhân vật của mình có đường chấm nối tới tâm ngắm, dài tối đa bằng tầm ném |
| Chuột trái | Ném bóng nước về phía con trỏ |
| Space / chuột phải | **Húc**: lao nhanh một đoạn ngắn |
| Tab (giữ) | Bảng thống kê trận |
| Esc | Menu: rời phòng, chỉnh âm lượng |

Sprite chỉ có hướng nhìn thẳng. Di chuyển hoặc ngắm sang trái thì **lật ngang** sprite.

### 4.2 Bóng nước
- Mỗi người có **3 quả**, hồi 1 quả mỗi 1 giây khi chưa đầy. Hai lần ném cách nhau ít nhất 0,25 giây.
- Lượt bấm ném xử lý từng cái một. Hết đạn hoặc đang trong thời gian chờ thì lượt bấm bị bỏ, không xếp hàng.
- Bóng xuất phát tại chân người ném, lệch 8px về hướng ngắm, rồi bay **thẳng** về phía con trỏ với tốc độ cố định. Va chạm tính ở mặt đất.
- Độ cong chỉ để trang trí: sprite nhấc lên `8 × sin(π × tiến độ)` px, với `tiến độ` từ 0 tới 1 trên quãng đường bay. Bóng đổ nằm dưới đất.
- Bóng nổ khi xảy ra điều nào trước:
  1. Chạm hình tròn va chạm của một **người phe địch** → **trúng thẳng**.
  2. Chạm **thùng xốp** (vật cản) → nổ tại chỗ.
  3. Bay hết quãng đường = khoảng cách tới con trỏ, kẹp trong khoảng [tầm tối thiểu, tầm tối đa] → **nổ đất**.
- Khi nổ, mọi **người phe địch** trong **bán kính văng** quanh điểm nổ đều **bị văng**. Không tính người vừa trúng thẳng.
- **Không bắn nhầm đồng đội**: bóng bay xuyên qua đồng đội, nổ không ảnh hưởng đồng đội.
- Không tính va chạm với người đang rơi, đang chờ hồi sinh, hoặc đang được bảo vệ (mục 4.7).

### 4.3 Độ ướt và lực đẩy (giống % sát thương trong Smash Bros)
- Mỗi người có **độ ướt** (`wet`, từ 0, không giới hạn, hiển thị dạng %). Hồi sinh thì về 0.
- Trúng thẳng: `wet += WET_DIRECT`. Bị văng: `wet += WET_SPLASH`. Bị húc: `wet += WET_DASH`.
- Cộng `wet` **trước**, rồi tính lực đẩy: `lực = LỰC_GỐC × (1 + wet / WET_SCALE)`.
- Hướng đẩy:
  - Trúng thẳng: theo hướng bay của bóng.
  - Bị văng: từ điểm nổ tới tâm người. Nếu khoảng cách < 1px thì dùng hướng bay của bóng.
  - Bị húc: theo hướng húc.
- Lực đẩy được **cộng** vào vận tốc đẩy `kb` (vector). Mỗi tick `kb *= exp(-KB_DECAY × dt)`.
- Sau khi bị trúng, người chơi bị **choáng** `HITSTUN` giây. Trong lúc choáng:
  - Khả năng tự điều khiển chỉ còn `HITSTUN_CONTROL`.
  - Không ném, không húc. Lượt bấm trong lúc này bị bỏ.
- Càng ướt càng bay xa. Đây là nhịp chính của game: người ướt sũng thì một quả bóng là văng.

### 4.4 Húc
- Hướng húc là hướng đang bấm phím di chuyển. Không bấm gì thì húc theo hướng ngắm.
- Lao `DASH_SPEED` trong `DASH_TIME` giây, hồi chiêu `DASH_COOLDOWN`. Không ném được trong lúc húc.
- Đụng **người phe địch** trong lúc húc: người đó bị đẩy theo hướng húc (lực `KB_DASH`). Người húc dừng lại ngay và kết thúc cú húc.
- Đụng đồng đội hoặc thùng xốp: dừng lại, không ai bị đẩy.
- Húc **không** bất tử, và hoàn toàn có thể tự lao xuống nước.

### 4.5 Di chuyển và va chạm
- Vận tốc cuối = `vận tốc tự đi` + `kb`.
- `vận tốc tự đi` tiến dần tới `hướng phím × MOVE_SPEED × (HITSTUN_CONTROL nếu đang choáng, không thì 1)` theo công thức `v += (đích − v) × min(1, MOVE_ACCEL × dt)`. Như vậy có chút trơn trượt.
- Người chơi là hình tròn bán kính `PLAYER_RADIUS`, đặt ở chân.
- Hai người chồng lên nhau (kể cả đồng đội) thì tách đều ra hai phía. Đứng sát nhau thì có thể bị dồn.
- **Thùng xốp** là hình vuông 16×16 cố định. Người chơi không đi xuyên qua được: bị đẩy ra ngoài, và thành phần `kb` hướng vào thùng bị triệt tiêu.
- Người chơi đi lại tự do khắp bè, sang được sân đối phương.

### 4.6 Bè và rơi xuống nước
- Bè luôn là hình chữ nhật, tâm (320, 199). Kích thước ban đầu `RAFT_W × RAFT_H` = 32×14 ô (512×224px).
- Đứng trên bè nghĩa là `|x − 320| < W×8` và `|y − 199| < H×8`, với W, H là số ô hiện tại.
- Mỗi tick, sau khi di chuyển: nếu **tâm** người chơi không còn trên bè thì người đó **rơi**.
  - Người rơi đứng yên tại chỗ bắt đầu rơi, thu nhỏ dần và nước bắn trong `FALL_TIME` giây.
  - **Đội kia được +1 điểm** ngay lúc bắt đầu rơi, kể cả khi người đó tự lao xuống.
- Ghi nhận công: nếu người rơi bị một người phe địch đánh trúng trong `KO_CREDIT_WINDOW` giây trước đó thì đó là **KO** của người đánh. Dòng thông báo:
  - Có người đánh: "**Bin** ném **Su** xuống nước!" (tên tô màu đội).
  - Không có ai: "**Su** tự nhảy xuống hồ!"
- **4 thùng xốp** đặt đối xứng, tâm tại (320 ± 120, 199 ± 56), tức các ô cột 8 và 23, hàng 3 và 10 của bè 32×14 (đánh số từ 0).

### 4.7 Hồi sinh và bảo vệ
- Sau khi rơi xong, người chơi chuyển sang **chờ hồi sinh** trong `RESPAWN_TIME` giây (HUD hiện đếm ngược).
- Hồi sinh tại **khu nhà** của đội: 3 cột ô thứ 2–4 tính từ mép bè phía đội đó (Đỏ bên trái, Xanh bên phải), theo kích thước bè **hiện tại**. Chọn điểm ngẫu nhiên theo seed trong khu nhà, cách người khác ít nhất 12px nếu có thể.
- Vừa hồi sinh thì được **bảo vệ** `SPAWN_PROTECT` giây:
  - Nhân vật mờ đi và nằm trong một **bong bóng xà phòng** lấp lánh.
  - Không bị bóng, văng hay húc ảnh hưởng.
  - Đi lại được nhưng không ném, không húc. Bấm ném hoặc húc thì **bỏ bảo vệ ngay** và thực hiện luôn hành động đó.
- Hồi sinh thì `wet = 0`, đầy đạn, hết hồi chiêu húc.

### 4.8 Nhịp trận và tỉ số
```
lobby → countdown (3s) → playing → [golden] → matchEnd (10s) → lobby
```
- Trong `countdown` và `matchEnd`, mọi người và bóng **đứng yên**, input bị bỏ qua.
- **Xuất phát**: mỗi đội đứng thành hàng dọc trong khu nhà của mình, giãn đều theo chiều cao bè.
- **Thắng**: đội nào đạt `SCORE_TO_WIN` điểm trước (mặc định 10; chủ phòng chọn 5, 10 hoặc 15).
- **Điểm quyết định**: khi một đội còn thiếu 1 điểm, hiện banner "ĐIỂM QUYẾT ĐỊNH — ĐỘI XANH!", nhạc nền nhanh hơn. Nếu cả hai đội cùng thiếu 1 điểm thì banner là "9 – 9! AI GHI TIẾP SẼ THẮNG!".
- **Phút cuối**: khi còn 60 giây (`LAST_MINUTE_AT`), bè cảnh báo 3 giây rồi co một vòng (32×14 → 30×12).
- **Hết giờ** (`MATCH_TIME`): đội dẫn điểm thắng. Nếu hòa thì vào **bàn thắng vàng**:
  - Banner "BÀN THẮNG VÀNG!". Điểm tiếp theo thắng trận.
  - Bè bắt đầu cảnh báo ngay khi vào bàn thắng vàng (co sau 3 giây), rồi cứ mỗi `GOLDEN_SHRINK_EVERY` giây co thêm một vòng, nhỏ nhất `RAFT_MIN`.
  - Thùng xốp nằm trên vòng bị gỡ thì chìm theo.
- **Co bè**: mỗi lần co gỡ một vòng ô ngoài cùng (mỗi bên 1 ô). Trước 3 giây, các ô sắp chìm **nứt và nhấp nháy đỏ**, kèm tiếng "rắc". Ô đang nhấp nháy vẫn đứng được, chỉ khi chìm hẳn mới tính là nước.
- **Chuỗi nóng tay**: một người có 3 KO liên tiếp mà chưa rơi lần nào thì hiện "**Tèo** đang nóng tay! 🔥". Có 5 KO liên tiếp thì hiện "**Tèo** KHÔNG THỂ CẢN!". Rơi thì chuỗi về 0.
- **Màn kết trận**:
  - Banner đội thắng, tỉ số cuối, nhân vật đội thắng làm động tác ăn mừng.
  - Ba danh hiệu vui:
    - **MVP**: nhiều KO nhất.
    - **Thánh Ném**: nhiều quả trúng thẳng nhất.
    - **Vua Tõm**: rơi nhiều nhất.
  - Bằng nhau thì người vào phòng sớm hơn được.
- Nếu giữa trận một đội không còn ai (tính cả bot) thì đội kia thắng luôn.

### 4.9 Bot
- Bot chạy trên server, đưa vào đúng cùng kiểu input như người thật.
- Hành vi bot:
  1. Chọn mục tiêu là **người phe địch** gần nhất, đang không được bảo vệ.
  2. Giữ khoảng cách 70–140px.
  3. Ném khi mục tiêu trong tầm. Ngắm đón đầu đơn giản: vị trí mục tiêu + vận tốc × thời gian bay.
  4. Tránh mép: nếu cách mép bè dưới 24px thì ưu tiên đi vào trong.
  5. Thỉnh thoảng húc khi đứng gần mục tiêu, nhưng không húc ra hướng mép gần.
  6. Có độ trễ phản xạ ngẫu nhiên 150–300ms để bot không quá giỏi.

### 4.10 Nhận biết phe và hiển thị tên (bắt buộc)
- **Toàn bộ đồng phục** mang màu đội, cộng thêm **vòng elip màu đội** dưới chân (12×5px).
- **Bóng nước** cũng mang màu đội người ném.
- **Bảng tên chỉ hiện trên đầu đồng đội** (màu đội mình). **Đối thủ không có bảng tên.** Mỗi máy tự quyết theo đội của người đang xem.
- Nhân vật của mình: bảng tên có thêm "(bạn)" và một mũi tên trắng nhỏ trên đầu.
- Ngoài sân, tên của mọi người (cả đối thủ) vẫn hiện ở: dòng thông báo, thẻ HUD dưới cùng, bảng Tab và màn kết trận.
- Người đang xem trận (chưa vào đội) thấy tên của cả hai đội.

### 4.11 Va chạm dây chuyền (M4, nên có)
- Người đang bị đẩy (`|kb| > CHAIN_KB_MIN`) mà đè lên **người phe mình** thì truyền `CHAIN_TRANSFER` phần `kb` cho người kia. Không cộng ướt. Mỗi cặp tối đa một lần trong `CHAIN_COOLDOWN` giây.
- Tạo cảnh "domino": một người văng ra kéo theo đồng đội đứng sát. Phạt lối đứng chụm lại.

### 4.12 Thứ tự xử lý trong một tick (`sim/world.ts`)
1. Đọc input: hướng đi, vị trí ngắm, các lượt bấm ném/húc mới.
2. Cập nhật đồng hồ: choáng, húc, hồi chiêu, hồi đạn, bảo vệ, chờ hồi sinh.
3. Hồi sinh người hết thời gian chờ. Tạo bóng mới, bắt đầu cú húc.
4. Tính vận tốc (tự đi + `kb`), cập nhật vị trí, giảm `kb`.
5. Va chạm với thùng xốp, va chạm người–người (tách ra, húc trúng, dây chuyền nếu có M4).
6. Di chuyển bóng, kiểm tra trúng thẳng, trúng thùng hoặc hết tầm, nổ, áp dụng ướt và lực đẩy.
7. Kiểm tra người rơi, cộng điểm, cập nhật người rơi xong thành chờ hồi sinh.
8. Đồng hồ trận, phút cuối, bàn thắng vàng, lịch co bè.
9. Kiểm tra thắng trận.
10. Trả về danh sách `GameEvent` của tick.

Seed và thứ tự input cố định thì kết quả phải giống hệt nhau. Duyệt người chơi theo slot tăng dần.

## 5. Bảng số liệu khởi đầu (`src/config.ts`)

Tick mô phỏng là 30Hz. Đơn vị: px, giây, px/giây.

| Hằng số | Giá trị | Ghi chú |
|---|---|---|
| `VIEW_W × VIEW_H` | 640 × 360 | Độ phân giải logic. ×2 = 1280×720, ×3 = 1920×1080 |
| `TILE` | 16 | |
| `POOL_RECT` | x 24–616, y 60–338 | Vùng nước |
| `RAFT_CENTER` | (320, 199) | |
| `RAFT_W × RAFT_H` | 32 × 14 ô | 512 × 224px |
| `RAFT_MIN` | 20 × 4 ô | Nhỏ nhất khi bàn thắng vàng |
| `COVERS` | tâm (200,143) (440,143) (200,255) (440,255), cỡ 16×16 | Thùng xốp |
| `MATCH_TIME` | 300 | 5 phút |
| `LAST_MINUTE_AT` | 60 | Giây còn lại thì co bè lần 1 |
| `GOLDEN_SHRINK_EVERY` | 20 | |
| `SCORE_TO_WIN` | 10 | Chủ phòng chọn 5 / 10 / 15 |
| `RESPAWN_TIME` / `SPAWN_PROTECT` | 3 / 1.5 | |
| `PLAYER_RADIUS` | 5 | |
| `MOVE_SPEED` / `MOVE_ACCEL` | 90 / 12 | |
| `BALLOON_SPEED` | 280 | |
| `BALLOON_RANGE_MIN / MAX` | 24 / 190 | |
| `BALLOON_RADIUS` | 3 | |
| `SPLASH_RADIUS` | 18 | |
| `AMMO_MAX` / `AMMO_REGEN` / `THROW_COOLDOWN` | 3 / 1.0 / 0.25 | |
| `KB_DIRECT` / `KB_SPLASH` / `KB_DASH` | 110 / 70 / 150 | Lực gốc |
| `WET_DIRECT` / `WET_SPLASH` / `WET_DASH` | 10 / 5 / 8 | |
| `WET_SCALE` | 50 | `wet` 50% thì lực ×2, 100% thì ×3 |
| `KB_DECAY` | 4.5 | Quãng trượt ≈ lực / 4.5 |
| `HITSTUN` / `HITSTUN_CONTROL` | 0.25 / 0.3 | |
| `DASH_SPEED` / `DASH_TIME` / `DASH_COOLDOWN` | 300 / 0.18 / 2.0 | |
| `FALL_TIME` | 0.6 | |
| `KO_CREDIT_WINDOW` | 3 | |
| `CHAIN_KB_MIN` / `CHAIN_TRANSFER` / `CHAIN_COOLDOWN` | 120 / 0.4 / 0.3 | M4 |
| `MAX_PLAYERS` | 10 | Tối đa 5 mỗi đội |
| `START_COUNTDOWN` | 3 | Giây, sau khi đủ điều kiện |
| `RECONNECT_GRACE` | 20 | Giây giữ chỗ khi rớt mạng |
| `MAX_ROOMS_PER_IP_PER_MIN` | 5 | |
| `MAX_MSGS_PER_SEC` | 60 | Mỗi client |
| `INTERP_DELAY_MS` | 120 | |
| `PROTOCOL_VERSION` | 3 | |

**Chỉ tiêu tinh chỉnh**: với 5v5 toàn bot, một trận tới 10 điểm kéo dài **3–5 phút**, và hơn một nửa số trận có tỉ số cuối cách nhau **≤ 3 điểm**. Trận quá nhanh thì giảm lực đẩy hoặc tăng `WET_SCALE`; quá chậm thì làm ngược lại.

## 6. Màn hình và luồng người dùng **[Đề xuất]**

### 6.1 Trang chủ
- Logo "TÉ NƯỚC!", ô nhập **tên** (tối đa 12 ký tự, lưu `localStorage`, bắt buộc trước khi vào trận).
- Bốn nút:
  1. **Ghép ngẫu nhiên** → mục 6.2.
  2. **Tạo phòng riêng** → mục 6.3.
  3. Ô **Mã phòng** + nút **Vào** → mục 6.3.
  4. **Chơi thử với bot** → chạy offline trên máy, không cần server (bạn + 7 bot, 4v4).
- Mở link `https://<domain>/#/r/ABCD` thì điền sẵn mã phòng, chỉ cần nhập tên rồi bấm Vào.
- Mở bằng điện thoại hoặc máy tính bảng thì hiện "Game cần bàn phím và chuột".
- Không kết nối được server thì hiện "Không kết nối được server" kèm nút **Thử lại**. Nút "Chơi thử với bot" vẫn dùng được.

### 6.2 Ghép ngẫu nhiên ("thế giới")
1. Bấm **Ghép ngẫu nhiên** → client gọi `joinOrCreate("match", { mode: "public", name })`. Server đưa vào một **phòng chờ công khai** còn chỗ và chưa bắt đầu trận, hết phòng thì tạo phòng mới.
2. Màn **Đang tìm người chơi…** hiện:
   - Radar xoay trong lúc chờ, số người "N/10" và 10 ô người chơi. Server tự chia đội cho đều; người chơi không đổi đội được ở chế độ này.
   - Ô trống hiện "Đang chờ", không hiển thị bot. Có nút **HỦY GHÉP TRẬN**.
3. **Luật bắt đầu**: khi phòng đủ đúng 10 người thật đang kết nối, server tự vào trận; không cần nút xác nhận hoặc đếm ngược tại sảnh. Nếu chưa đủ 10 người thì tiếp tục chờ.
4. Lúc vào trận:
   - Server **khóa phòng** (`lock()`) để người mới được ghép sang phòng khác.
   - Chế độ công khai luôn là **5v5 người thật, tới 10 điểm**, không lấp bot kể cả khi có người rời giữa trận.
5. Hết trận: phòng **mở khóa** nếu còn dưới 10 người; nếu đủ 10 người vẫn kết nối thì sau 1 giây ở sảnh sẽ tự vào trận mới.
6. Phòng công khai rỗng người thật thì tự hủy.

### 6.3 Phòng riêng
- **Tạo**: client gọi `create("match", { mode: "private", name })`.
  - Server đặt **mã phòng 4 chữ** làm `roomId`, bảng chữ `ABCDEFGHJKLMNPQRSTUVWXYZ` (bỏ I và O).
  - Phòng được đặt `setPrivate(true)` nên **không bao giờ** bị ghép ngẫu nhiên vào. Chỉ ai có mã mới vào được.
  - Người tạo là **chủ phòng** (vương miện).
- **Vào**: client gọi `joinById(MÃ, { name })`. Mã được chuyển sang chữ in hoa và bỏ khoảng trắng trước khi gửi.
  - Mã sai hoặc phòng đã hủy → "Không tìm thấy phòng".
  - Phòng đủ 10 người → "Phòng đầy".
- **Sảnh chờ** có hai cột **ĐỘI ĐỎ** | **ĐỘI XANH**:
  - Mã phòng in to, nút **Copy link**.
  - Mỗi cột có 4 hoặc 5 ô theo chế độ. Ô có người hiện hình đồng phục, tên, ping, vương miện cho chủ phòng. Ô trống ghi "bot" nếu bật lấp bot, không thì ghi "trống".
  - Ai cũng bấm **Sang đội này** được nếu đội kia còn chỗ. Người mới vào được xếp vào đội ít người hơn, bằng nhau thì vào Đỏ.
  - Chủ phòng có thêm:
    - chọn **4v4 / 5v5** (không chọn được 4v4 khi một đội đang có 5 người thật);
    - chọn điểm thắng **5 / 10 / 15**;
    - bật/tắt **Lấp chỗ trống bằng bot** (mặc định bật);
    - nút **Xáo đội**;
    - nút **Bắt đầu**: cần mỗi đội ít nhất 1 người, tính cả bot.
  - Người khác thấy dòng "Chờ chủ phòng bắt đầu…".
- **Chủ phòng thoát** → người thật vào phòng sớm nhất còn lại thành chủ phòng mới. Trận vẫn tiếp tục, vì trận chạy trên server.
- **Vào giữa trận**: phòng riêng **không khóa** khi đang chơi.
  - Người mới vào đội ít người hơn, **thay chỗ một bot** nếu đội đó có bot.
  - Không có bot thì vào thẳng nếu đội còn chỗ, hết chỗ thì "Phòng đầy".
- Hết trận thì về sảnh, giữ nguyên phòng và đội để đấu lại.

### 6.4 Chung cho cả hai loại phòng
- **Tên trùng** trong một phòng: server tự thêm số, ví dụ "Tèo", "Tèo 2".
- **Tên bot** lấy lần lượt từ danh sách Tèo, Tí, Bin, Su, Na, Mập, Khoa, Hưng, Mai, Vy (bỏ tên đã có người dùng), kèm " (bot)".
- Server tự gán **kiểu đồng phục** (0–4) còn trống trong đội. Đổi đội thì gán lại.
- **Rớt mạng giữa trận**: server giữ chỗ `RECONNECT_GRACE` (20) giây. Nhân vật đứng yên, vẫn có thể bị đẩy.
  - Kết nối lại kịp thì chơi tiếp.
  - Quá giờ: bật lấp bot thì bot thay vào ngay chỗ đó, không thì xóa nhân vật. Không tính điểm cho ai.
- **Trong trận**: canvas game và HUD.
  - **Trên giữa**: bảng tỉ số lớn `ĐỎ 8 : 9 XANH`, dưới là đồng hồ `2:31`. Banner điểm quyết định, phút cuối, bàn thắng vàng hiện ngay dưới.
  - **Trên trái**: loại phòng và mã (`PHÒNG KHVT · 5v5 · tới 10 điểm` hoặc `GHÉP NGẪU NHIÊN · 5v5`).
  - **Trên phải**: dòng thông báo (tối đa 4 dòng, mỗi dòng tự mất sau 4 giây).
  - **Dưới cùng**: bên trái là thẻ Đội Đỏ, bên phải là thẻ Đội Xanh. Mỗi thẻ có mặt đồng phục, tên, % ướt (hoặc "HỒI 2" khi chờ hồi sinh, "BẢO VỆ" khi đang được bảo vệ), số KO.
  - **Trên đầu đồng đội**: bảng tên. Đối thủ không có tên. Trên đầu mình thêm 3 chấm đạn.
- **Kết trận**: overlay đội thắng, tỉ số, ba danh hiệu, rồi về sảnh hoặc phòng chờ.
- **Thông báo lỗi** (tiếng Việt, ngắn):
  - "Không kết nối được server"
  - "Không tìm thấy phòng"
  - "Phòng đầy"
  - "Mất kết nối — đang thử lại…"
  - "Phiên bản khác nhau — tải lại trang (F5)"

## 7. Cách làm: so sánh các phương án

| | A. Chỉ S3 + P2P, một máy người chơi chạy luật | B. S3 + **server game riêng** (**bạn chốt**) | C. S3 + dịch vụ realtime (Supabase/Firebase) |
|---|---|---|---|
| Nhiều phòng, ghép người lạ | Khó: không có chỗ trung tâm để ghép | ✅ Server ghép phòng | Ghép được nhưng vẫn cần một máy chạy luật |
| Công bằng, chống gian lận | Chủ phòng ping 0, sửa được luật trên máy mình | ✅ Server quyết mọi thứ | Như A |
| Chủ phòng thoát | Cả phòng kết thúc | ✅ Trận vẫn chạy | Như A |
| Chi phí | ~0đ | Một máy ảo nhỏ | Free tier có giới hạn |
| Độ trễ ở VN | Tốt | Tốt nếu server ở Singapore | Cao hơn |

**[Bạn chốt] Chọn B**, vì cần nhiều phòng và ghép người lạ.

**[Đề xuất] Framework server: Colyseus 0.18** (Node.js, TypeScript, mã nguồn mở). Lý do:
- Có sẵn phòng, ghép phòng, phòng riêng, khóa phòng.
- Có đồng bộ trạng thái, kết nối lại và công cụ netcode (bước cố định, dự đoán phía client, nội suy). Không phải tự viết lại phần mạng.
- Cùng ngôn ngữ TypeScript với client, nên **luật game (`packages/shared`) chạy y hệt trên server và client**.
- Loại phương án tự viết bằng thư viện `ws` vì phải tự làm ghép phòng, kết nối lại và đồng bộ.

## 8. Kiến trúc kỹ thuật

### 8.1 Công nghệ
- **Monorepo npm workspaces**, TypeScript strict, Node LTS hiện hành.
- **`packages/shared`**: luật game thuần TS (`sim/`), `config.ts`, kiểu dữ liệu, tên message. Không DOM, không mạng, không `Math.random`.
- **`apps/server`**: Colyseus **0.18** (gói `colyseus`, `@colyseus/schema` 5, phần test của Colyseus nếu có cho đúng phiên bản).
  - Dùng `create-colyseus-app` (preset `realtime-action`, chế độ không tương tác) để dựng khung, rồi đổi theo cấu trúc mục 8.2.
  - **Đọc docs Colyseus 0.18 cho đúng phiên bản đã cài** trước khi viết code mạng; API đổi nhiều qua các phiên bản.
- **`apps/client`**: Vite + TypeScript, **Canvas 2D**, SDK client Colyseus đúng phiên bản 0.18.
- **Vitest** cho `shared`, `server`, `client`.
- **Font** VT323 (`@fontsource/vt323`, có tiếng Việt). **Âm thanh** ZzFX.
- **Hạ tầng**: Docker cho server, **Caddy** làm HTTPS/WSS tự động, máy ảo AWS ở **Singapore (ap-southeast-1)**.

### 8.2 Cấu trúc thư mục
```
package.json              npm workspaces: packages/*, apps/*
AGENTS.md                 hướng dẫn cho Codex
packages/shared/src/
  config.ts               TẤT CẢ hằng số mục 5 và mục 8.5
  sim/types.ts            Team, PlayerState, BalloonState, RaftState, MatchState, InputFrame, GameEvent, Roster
  sim/rng.ts              mulberry32(seed)
  sim/raft.ts             kích thước bè, isOnRaft, khu nhà, lịch co, thùng xốp
  sim/movement.ts         di chuyển, va chạm người–người, thùng, húc
  sim/balloons.ts         bay, va chạm, nổ, văng (lọc theo phe)
  sim/match.ts            tỉ số, đồng hồ, phút cuối, bàn thắng vàng, chuỗi, danh hiệu
  sim/world.ts            createMatch(seed, roster, settings) và step(world, inputs, dt) → GameEvent[]
  sim/bot.ts              botInput(world, slot, rng) → InputFrame
  protocol.ts             tên message, kiểu payload, validateInput()
  names.ts                chuẩn hóa tên, khử trùng tên, tên bot
apps/server/src/
  index.ts                khởi động Colyseus, route /health
  rooms/MatchRoom.ts      một loại phòng "match" cho cả công khai và riêng
  rooms/roomCode.ts       sinh mã 4 chữ không trùng (Presence API)
  rooms/lobby.ts          logic sảnh: xếp đội, chủ phòng, luật bắt đầu, lấp bot (thuần, test được)
  rooms/schema.ts         Schema đồng bộ: LobbyState + GameState
  rooms/rateLimit.ts      giới hạn tạo phòng theo IP
apps/client/src/
  main.ts, net/colyseus.ts, net/interp.ts, net/predict.ts
  render/renderer.ts, render/sprites.ts, render/effects.ts, render/overlay.ts
  ui/home.ts, ui/matchmaking.ts, ui/privateLobby.ts, ui/results.ts, ui/escMenu.ts
  input/keyboardMouse.ts, audio/sfx.ts, offline/practice.ts
apps/client/public/assets/  sprite, nền, manifest.json (đã có sẵn trong gói)
infra/
  docker-compose.yml, Caddyfile, server.Dockerfile
  deploy-client.sh (S3 + CloudFront), deploy-server.sh (ssh + docker compose)
docs/                     design.md (tài liệu này), mockup, plan
```

### 8.3 Phòng `match` trên server
- Đăng ký **một** loại phòng `"match"` với `filterBy(["mode"])`, `maxClients = 10`.
- `onCreate(options)`:
  - `mode` chỉ nhận `"public"` hoặc `"private"`, sai thì từ chối.
  - Phòng riêng: `roomId = await generateRoomCode()` (4 chữ, đăng ký bằng Presence API, thử lại đến khi không trùng, trả lại mã ở `onDispose`), rồi `setPrivate(true)`.
  - Gắn metadata `{ mode }`.
- **Không có `onAuth` chặn ai** ngoài kiểm tra tên hợp lệ. Phòng riêng chỉ cần mã là vào được, giống "link mời".
- **Giới hạn tạo phòng**: mỗi IP tối đa `MAX_ROOMS_PER_IP_PER_MIN` (5) lần tạo phòng mỗi phút. Vượt thì từ chối với lý do `"rate_limited"`.
- **Tick**: chạy `step()` của `packages/shared` với bước cố định 30Hz (API bước cố định của 0.18). Mỗi tick lấy input mới nhất của từng người và input của bot.
- **Đồng bộ**:
  - `LobbyState` (danh sách người, đội, kiểu đồng phục, sẵn sàng, chủ phòng, cài đặt, phase, đếm ngược) và `GameState` (người chơi, bóng, bè, tỉ số, đồng hồ) đồng bộ bằng Colyseus Schema.
  - Tọa độ dùng kiểu số nén (quantized) của Schema 5.
  - Tần số gửi bản vá 15–20Hz.
- **Sự kiện một lần** (`burst`, `hit`, `fall`, `score`, `respawn`, `streak`, `matchPoint`, `lastMinute`, `golden`, `shrinkWarn`, `shrink`, `matchEnd`) gửi bằng message `"ev"` (mảng `GameEvent`) ngay trong tick xảy ra.
- **Khóa/mở**:
  - Phòng công khai `lock()` khi vào trận và `unlock()` khi về phòng chờ (nếu còn chỗ).
  - Phòng riêng chỉ khóa khi đủ 10 người.
- **Kết nối lại**: `allowReconnection(client, RECONNECT_GRACE)` khi rớt mạng mà không chủ động thoát.
- **Tự hủy** khi không còn người thật (mặc định của Colyseus khi phòng trống; bot không tính).

### 8.4 Message client ↔ server

| Chiều | Tên | Nội dung | Ai được gửi |
|---|---|---|---|
| C→S | `in` | `{ s: seq, mx, my, ax, ay, th, da }` | mọi người, 30Hz khi đang trong trận |
| C→S | `ready` | `{ on: boolean }` | phòng công khai, lúc chờ |
| C→S | `team` | `{ team: 0 \| 1 }` | phòng riêng, lúc ở sảnh |
| C→S | `settings` | `{ teamSize?: 4 \| 5, scoreToWin?: 5 \| 10 \| 15, botFill?: boolean }` | chủ phòng riêng |
| C→S | `shuffle` | `{}` | chủ phòng riêng |
| C→S | `start` | `{}` | chủ phòng riêng |
| S→C | (Schema) | `LobbyState`, `GameState` | tự động |
| S→C | `ev` | `GameEvent[]` | mỗi tick có sự kiện |
| S→C | `err` | `{ code, message }` | khi từ chối một yêu cầu |

Giải thích các trường trong `in`:
- `mx, my`: hướng đi.
- `ax, ay`: tâm ngắm (tọa độ thế giới).
- `th`, `da`: **bộ đếm tăng dần** số lần bấm ném và bấm húc. Server so với giá trị trước để biết lượt bấm mới, nên không bao giờ mất lượt bấm.

**An toàn** (server là nơi duy nhất quyết định):
- Mọi message được kiểm tra bằng `validateInput()` / kiểm tra kiểu. Sai thì bỏ qua.
- `mx, my` kẹp trong [−1, 1] rồi chuẩn hóa. `th`/`da` chỉ được tăng, mỗi tick xử lý tối đa 1 lượt mỗi loại.
- Mỗi client gửi tối đa 60 message/giây, vượt thì bỏ bớt.
- Message của người không phải chủ phòng gửi lệnh chủ phòng thì bị từ chối bằng `err`.
- Tên chỉ hiển thị qua `textContent` hoặc canvas, **không bao giờ** qua `innerHTML`.
- `PROTOCOL_VERSION` gửi kèm lúc join. Khác phiên bản thì server từ chối với `"version_mismatch"`.

### 8.5 Netcode phía client
- **Ưu tiên công cụ netcode có sẵn của Colyseus 0.18**: bước cố định, dự đoán phía client chạy chính `step` của `packages/shared`, nội suy cho thực thể của người khác.
- Nếu công cụ có sẵn không khớp với luật game thì dùng cách dự phòng sau:
  - **Người khác và bóng**: vẽ ở thời điểm `now − INTERP_DELAY_MS` (120ms), nội suy tuyến tính giữa 2 trạng thái nhận được.
  - **Nhân vật của mình** ở trạng thái `alive` hoặc `protected`:
    - Tự chạy `movement` với input của mình (không tính va chạm người khác).
    - So vị trí đã dự đoán ở `ackSeq` với vị trí server gửi. Lệch hơn 24px thì nhảy tới vị trí server, ít hơn thì kéo dần về 20% mỗi khung hình.
  - Ở các trạng thái `hitstun | dashing | falling | respawning`: **tắt dự đoán**, dùng đúng trạng thái server.
- **Không vẽ bóng "ảo"**: động tác ném hiện ngay, nhưng quả bóng chỉ hiện khi server gửi về.
- Hiệu ứng và âm thanh chạy theo `ev` **tại tọa độ server gửi**. Client không tự suy ra va chạm.
- **Chơi thử với bot** (offline): client tự chạy `createMatch` + `step` + `botInput` của `packages/shared`, không cần server.

### 8.6 Hiển thị
- Canvas game 640×360 phóng to **số nguyên** lớn nhất vừa cửa sổ, `image-rendering: pixelated`, `imageSmoothingEnabled = false`. Phần thừa để viền màu tối.
- Thứ tự vẽ:
  1. Nền.
  2. Nước gợn.
  3. Bọt quanh bè, rồi bè, vạch giữa, khu nhà, cờ đội.
  4. Bóng đổ, vòng màu đội dưới chân.
  5. Các thực thể sắp theo `y`.
  6. Hiệu ứng.
  7. Overlay chữ ở độ phân giải thật.
- Độ ướt: phủ màu xanh, độ đậm 0 → 40% khi `wet` từ 0 → 150. Có giọt nước rơi khi `wet > 50`.
- Rung màn hình 2px trong 0,15 giây khi **chính mình** bị trúng thẳng. Bảng tỉ số nảy lên khi có đội ghi điểm.

### 8.7 Đồ họa (đã có sẵn trong `apps/client/public/assets/`)
- **Sprite người chơi**: 10 sheet `player_red_v0..v4.png`, `player_blue_v0..v4.png`. Mỗi khung 16×24, gốc tọa độ ở chân (giữa, đáy). Một hàng 13 khung:
  - `idle` ×2, `walk` ×4, `throw` ×3, `dash` ×1, `hit` ×1, `win` ×2.
- Các asset khác:
  - `bg.png` 640×360: trời, sân thượng, sàn, hồ, chưa có bè.
  - Ván bè và mép bè, hiệu ứng nứt/nhấp nháy.
  - Thùng xốp, cờ đội.
  - Bóng nước trắng (nhuộm màu đội lúc chạy).
  - Hiệu ứng nổ, cột nước, bong bóng bảo vệ.
- Mọi thứ khai báo trong `manifest.json`: tên file, kích thước khung, số khung, fps, điểm neo.
- **Thiếu asset**: renderer vẽ thay bằng hình tròn màu đội và không được làm game dừng.

## 9. Triển khai
- **Client**:
  - `npm run build -w apps/client` tạo `dist/`.
  - S3 bucket private + CloudFront (Origin Access Control), HTTPS mặc định.
  - `infra/deploy-client.sh`:
    1. `aws s3 sync` với `Cache-Control` immutable cho file có hash, `no-cache` cho `index.html`.
    2. Invalidation `/index.html`.
  - Biến môi trường build: `VITE_SERVER_URL=wss://<subdomain server>`.
- **Server**:
  - Máy ảo nhỏ ở **AWS Singapore** (Lightsail hoặc EC2), mở cổng 80 và 443.
  - Một **subdomain** trỏ bản ghi A về IP máy, ví dụ `game-api.<domain-của-bạn>`.
  - `infra/docker-compose.yml` chạy hai service:
    - `server`: image từ `infra/server.Dockerfile`, cổng 2567 chỉ mở trong mạng Docker.
    - `caddy`: tự xin chứng chỉ HTTPS và chuyển `wss://` / `https://` vào `server:2567`.
  - Biến môi trường: `PORT`, `ALLOWED_ORIGIN` (domain CloudFront, dùng cho CORS), `ADMIN_PASSWORD` (bảo vệ trang theo dõi phòng nếu bật).
  - `infra/deploy-server.sh`: ssh lên máy, `git pull`, `docker compose up -d --build`.
- **Theo dõi**:
  - `GET /health` trả `{ ok: true, rooms, clients }`.
  - Log JSON mỗi lần tạo phòng, hủy phòng, bắt đầu trận, kết thúc trận.
- **Mở rộng sau v1** (không làm bây giờ): nhiều tiến trình hoặc nhiều máy với Redis Presence/Driver của Colyseus.

## 10. Kiểm thử
- **`packages/shared`** (Vitest):
  - Công thức lực đẩy.
  - Bóng nổ khi hết tầm và khi trúng thùng.
  - Bóng xuyên đồng đội; nổ không ảnh hưởng đồng đội.
  - Trúng thẳng không văng thêm chính mục tiêu.
  - Rơi thì đội kia +1, kể cả tự rơi.
  - Hồi sinh đúng khu nhà; bảo vệ chặn lực đẩy; bấm ném thì mất bảo vệ.
  - Phút cuối co bè; hòa hết giờ vào bàn thắng vàng; điểm vàng kết thúc trận; thắng khi đủ điểm.
  - `th`/`da` không mất lượt.
  - Cùng seed thì kết quả giống hệt nhau.
- **`apps/server`** (test phòng của Colyseus hoặc client SDK nối vào server chạy thử):
  - Phòng riêng có mã 4 chữ hợp lệ; `joinById` vào được; `joinOrCreate` công khai **không bao giờ** vào phòng riêng.
  - Chín người ghép ngẫu nhiên vẫn chờ; người thứ 10 làm trận 5v5 bắt đầu tự động, không có bot; người thứ 11 sang phòng mới.
  - Phòng công khai khóa khi vào trận và mở lại sau trận nếu còn dưới 10 người.
  - Chủ phòng thoát thì chuyển quyền; người thường gửi `start` bị từ chối.
  - Input sai định dạng bị bỏ qua, không làm sập phòng.
  - Rớt mạng rồi kết nối lại trong 20 giây thì giữ nguyên chỗ.
  - Giới hạn tạo phòng theo IP.
- **Tải**: script tạo 100 client giả (`scripts/loadtest.ts`), 20 phòng ghép ngẫu nhiên, mỗi client gửi input 30Hz trong 2 phút. Tick trung bình của server dưới 5ms mỗi phòng, không phòng nào rơi tick.
- **Thử thật**: 3 máy khác mạng (một máy dùng 4G) chơi hết một trận ghép ngẫu nhiên và một trận phòng riêng qua server Singapore.

## 11. Các cột mốc
- **M1 — Luật game + chơi offline**: `packages/shared` đầy đủ, có test; client vẽ và chơi offline với bot.
- **M2 — Server + phòng riêng**: Colyseus, phòng `match` chế độ riêng, sảnh chia đội, đồng bộ, netcode phía client.
- **M3 — Ghép ngẫu nhiên**: phòng công khai, luật bắt đầu, khóa/mở, kết nối lại, giới hạn tạo phòng.
- **M4 — Hoàn thiện + triển khai**: HUD, banner, danh hiệu, âm thanh, asset thật, Docker/Caddy, deploy S3 và server, thử tải.
- **M5 — Đánh bóng**: va chạm dây chuyền, hiệu ứng thêm, tinh chỉnh số theo chỉ tiêu mục 5.

## 12. Phần để người code tự quyết
- Tổ chức code bên trong mỗi file, chi tiết Schema (giữ đúng các trường ở trên).
- Dùng phần nào của bộ netcode Colyseus 0.18, miễn đạt đúng hành vi mục 8.5.
- CSS các màn DOM (phong cách pixel, font VT323), tham số ZzFX, hạt nước và hiệu ứng.
- Cách viết AI bot cụ thể, miễn đúng hành vi mục 4.9.
- Tinh chỉnh mọi con số trong `config.ts` để đạt chỉ tiêu ở mục 5.
