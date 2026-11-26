# TÉ NƯỚC! — Tài liệu thiết kế (bản 2: đấu đội)

> Game web online, 2 đội × 4–5 người, ném bóng nước để đẩy đối thủ văng khỏi chiếc bè lớn giữa hồ bơi. Đội nào đẩy rơi đủ **10 lượt** trước thì thắng.
> Tài liệu này đủ để một người (hoặc Codex) lập kế hoạch và code mà không cần hỏi lại.
> Mọi con số ở mục 5 là **giá trị khởi đầu để tinh chỉnh** và phải nằm trong `src/config.ts`.

Ký hiệu: **[Bạn chốt]** = chủ dự án đã quyết. **[Đề xuất]** = người thiết kế quyết thay, có thể đổi.

---

## 1. Ý tưởng và lý do

- **[Bạn chốt]** Game online trên trình duyệt để một nhóm bạn (5 người trở lên) đánh nhau cho vui.
- **[Bạn chốt]** Lối chơi: ném bóng nước, bị trúng thì bị đẩy lùi, văng ra khỏi khu vực là mất lượt.
- **[Bạn chốt]** Chơi **theo đội, mỗi đội 4 hoặc 5 người**. Bản đồ **rộng hơn** bản đầu.
- **[Bạn chốt]** Đua tới **10 điểm** để trận đấu kịch tính.
- **[Bạn chốt]** Phần web host trên **AWS S3**.
- **[Bạn chốt]** **Cả đội mặc chung một màu**: Đội Đỏ và Đội Xanh dương.
- **[Bạn chốt]** **Chỉ đồng đội mới hiện tên** trên đầu. Đối thủ không có tên.
- **[Bạn chốt]** Nhân vật pixel nhìn thẳng. Hai ảnh tham khảo (ảnh stock có watermark, và lính canh trong phim Squid Game) **không dùng**. Nhân vật trong game là **đồng phục đội tự thiết kế, nguyên bản**.
- **[Bạn chốt]** Bối cảnh do người thiết kế đề xuất. Codex sẽ code logic game từ tài liệu này.

**[Đề xuất] Cách hiểu "thang điểm 10"**: mỗi lần một người rơi xuống nước thì **đội kia được 1 điểm**. Người rơi **hồi sinh sau 3 giây** ở phía sân nhà. Đội nào tới 10 điểm trước thì thắng. Như vậy không ai phải ngồi chờ, tỉ số nhảy liên tục, và có những khoảnh khắc 9–9. (Phương án "thắng 10 ván" bị loại vì một trận sẽ dài hơn 20 phút.)

Thành công nghĩa là một nhóm bạn mở link, chia đội trong vòng 1 phút, chơi một trận 3–5 phút, hò hét lúc tỉ số sát nút, và muốn đấu lại.

## 2. Mục tiêu, không làm, và những thứ phải tránh

**Mục tiêu (v1)**
- 2 đội **Đỏ** và **Xanh**, đấu 4v4 hoặc 5v5. Chỗ trống được lấp bằng bot.
- Vào phòng bằng **mã 4 chữ** hoặc **link chia sẻ**. Không cần tài khoản.
- Một trận dài 3–5 phút, đua tới 10 điểm. Có giới hạn thời gian và **bàn thắng vàng**.
- Chạy trên Chrome, Edge, Firefox, Safari máy tính, điều khiển bằng bàn phím và chuột.
- Chi phí vận hành gần như 0đ: S3 + CloudFront + dịch vụ miễn phí (relay tìm phòng, TURN).
- Chơi thử một mình với bot, không cần mạng.

**Không làm trong v1** (để sau)
- Đăng nhập, lưu thành tích, bảng xếp hạng.
- Ghép trận với người lạ, danh sách phòng công khai.
- Điều khiển cảm ứng trên điện thoại.
- Hơn 2 đội, hơn 10 người một phòng.
- Chuyển quyền chủ phòng khi chủ phòng thoát.
- Chống gian lận, chat chữ, voice chat, vật phẩm nhặt được.

**Phải tránh** (dù game chạy được cũng coi là hỏng)
- Vào phòng rườm rà: phải cài đặt hoặc qua quá 3 bước.
- Không phân biệt được ai phe mình, ai phe địch chỉ trong một cái liếc.
- Trúng đòn "oan": nhìn thấy bóng trượt mà vẫn bị đẩy. Hiệu ứng nổ phải hiện **đúng chỗ** host tính.
- Bị "canh điểm hồi sinh": vừa hồi sinh đã bị đẩy rơi ngay.
- Một người spam bóng là thắng. Đã có giới hạn bằng hệ thống đạn.
- Trận đấu hết hồi hộp vì một đội bỏ xa quá sớm.

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

Trong một đội, 5 người khác nhau nhẹ ở **màu da, tóc lộ ra dưới nón và màu tròng kính** (5 kiểu, bảng `UNIFORM_VARIANTS`). Host tự gán kiểu theo thứ tự trong đội để không ai trùng. Người chơi **không chọn nhân vật**; danh tính là cái tên.

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
  - Bè co thêm một vòng ngay lúc bắt đầu, rồi cứ mỗi `GOLDEN_SHRINK_EVERY` giây co thêm một vòng, nhỏ nhất `RAFT_MIN`.
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
- Bot chạy trên máy chủ phòng, đưa vào đúng cùng kiểu input như người thật.
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

**Chỉ tiêu tinh chỉnh**: với 5v5 toàn bot, một trận tới 10 điểm kéo dài **3–5 phút**, và hơn một nửa số trận có tỉ số cuối cách nhau **≤ 3 điểm**. Trận quá nhanh thì giảm lực đẩy hoặc tăng `WET_SCALE`; quá chậm thì làm ngược lại.

## 6. Màn hình và luồng người dùng **[Đề xuất]**

1. **Trang chủ**
   - Logo "TÉ NƯỚC!".
   - Ô nhập tên, tối đa 12 ký tự, lưu `localStorage`.
   - Nút **Tạo phòng**, ô **Mã phòng** + nút **Vào**, nút **Chơi thử với bot** (offline, không cần mạng: bạn + 7 bot, 4v4).
   - Mở bằng điện thoại hoặc máy tính bảng: hiện "Game cần bàn phím và chuột".
2. **Mở link** `https://<domain>/#/r/ABCD`: điền sẵn mã phòng. Chỉ cần nhập tên rồi bấm Vào.
3. **Sảnh chờ** — hai cột **ĐỘI ĐỎ** | **ĐỘI XANH**
   - Mã phòng in to, nút **Copy link**.
   - Mỗi cột có 4 hoặc 5 ô (theo chế độ). Ô có người hiện nhân vật, tên, ping, vương miện cho chủ phòng. Ô trống ghi "bot" nếu bật lấp bot, không thì ghi "trống".
   - Ai cũng bấm **Sang đội này** được nếu đội kia còn chỗ. Mỗi ô hiện hình đồng phục theo kiểu được gán.
   - Người mới vào được xếp vào đội ít người hơn, hai đội bằng nhau thì vào Đỏ.
   - Chủ phòng có thêm:
     - Chọn chế độ **4v4 / 5v5**. Không chọn được 4v4 nếu một đội đang có 5 người thật.
     - Chọn điểm thắng **5 / 10 / 15**.
     - Bật/tắt **Lấp chỗ trống bằng bot** (mặc định bật).
     - Nút **Xáo đội** (chia ngẫu nhiên người thật cho đều).
     - Nút **Bắt đầu**: cần mỗi đội ít nhất 1 người tính cả bot.
   - Người khác thấy dòng "Chờ chủ phòng bắt đầu…".
   - Tên bot lấy lần lượt từ danh sách Tèo, Tí, Bin, Su, Na, Mập, Khoa, Hưng, Mai, Vy (bỏ tên đã có người dùng), kèm " (bot)".
   - Đổi đội thì host gán lại kiểu đồng phục còn trống trong đội mới.
   - Slot của người rời phòng được dùng lại cho người vào sau.
4. **Trong trận**: canvas game và HUD.
   - **Trên giữa**: bảng tỉ số lớn `ĐỎ 8 : 9 XANH`, dưới là đồng hồ `2:31`. Banner điểm quyết định, phút cuối, bàn thắng vàng hiện ngay dưới.
   - **Trên phải**: dòng thông báo (tối đa 4 dòng, mỗi dòng tự mất sau 4 giây).
   - **Dưới cùng, trái**: 4–5 thẻ của Đội Đỏ. **Dưới cùng, phải**: 4–5 thẻ của Đội Xanh. Mỗi thẻ có mặt nhân vật, tên, % ướt (hoặc "HỒI 2" khi đang chờ hồi sinh, "BẢO VỆ" khi đang được bảo vệ), số KO.
   - **Trên đầu đồng đội**: bảng tên. Đối thủ không có tên. Trên đầu mình thêm 3 chấm đạn.
5. **Kết trận**: overlay đội thắng, tỉ số, ba danh hiệu, rồi về sảnh, giữ nguyên phòng và đội để đấu lại.
6. **Người vào giữa trận**: vào đội ít người hơn, **thay chỗ một bot** nếu đội đó đang có bot. Không có bot thì vào thẳng nếu đội còn chỗ, hết chỗ thì xem đến trận sau.
7. **Người thoát giữa trận**: nếu bật lấp bot thì host thêm một bot vào chỗ đó ngay.
8. **Lỗi**: dùng các thông báo tiếng Việt ngắn sau.
   - "Không tìm thấy phòng"
   - "Phòng đầy"
   - "Chủ phòng đã thoát"
   - "Phiên bản khác nhau — tải lại trang (F5)"

## 7. Cách làm: so sánh các phương án

| | A. Chỉ S3 + P2P, chủ phòng chạy luật (**đã chọn**) | B. S3 + server WebSocket riêng | C. S3 + dịch vụ realtime (Supabase/Firebase) |
|---|---|---|---|
| Chi phí | ~0đ | Tiền VPS/Fly + công vận hành | Free tier có giới hạn số tin nhắn |
| Độ trễ | Thấp nhất (máy nối thẳng nhau) | Tốt nếu server ở gần (SG) | Cao hơn, mọi tin nhắn đi qua dịch vụ |
| Công bằng | Chủ phòng ping 0 | Công bằng | Vẫn phải có một máy làm chủ |
| Ổn định | Phụ thuộc mạng và tab của chủ phòng | Cao | Trung bình |
| Đúng ý "chỉ S3" | ✅ | ❌ | ⚠️ |

**[Đề xuất] Chọn A** (bạn giao phần này cho người thiết kế) vì đúng yêu cầu chỉ dùng S3, gần như miễn phí, và độ trễ tốt khi chơi với bạn bè cùng thành phố. Loại C vì không hơn A ở điểm nào với một game hành động. Giới hạn 10 người một phòng cũng đến từ A: mỗi máy giữ kết nối với tất cả máy còn lại.

Để còn đường lùi sang B: **logic game là module thuần TypeScript, không phụ thuộc mạng hay DOM**. Lớp mạng chỉ đi qua một interface `Transport`.

## 8. Kiến trúc kỹ thuật

### 8.1 Công nghệ
- **Vite + TypeScript (strict)**. Không dùng game engine, vẽ bằng **Canvas 2D**. Lý do: game chỉ cần hình tròn, ô vuông và sprite, tự viết thì dễ kiểm soát và dễ test.
- **Trystero** (npm `trystero`) cho WebRTC P2P và tìm phòng không cần server.
  - Dùng strategy mặc định (Nostr).
  - Nếu test thấy vào phòng chậm hoặc hay lỗi thì đổi sang `@trystero-p2p/mqtt`. Chỉ phải đổi import trong `trysteroTransport.ts`.
  - Đọc README của **đúng phiên bản đã cài**, vì API đã đổi qua các phiên bản.
- **TURN**: Open Relay (Metered), gói miễn phí 20GB/tháng.
  - API key loại "credential" được phép để ở frontend.
  - Lúc vào phòng, gọi `https://<app>.metered.live/api/v1/turn/credentials?apiKey=...` rồi truyền kết quả vào `turnConfig` của Trystero.
  - Gọi lỗi thì chỉ dùng STUN mặc định, game vẫn chạy với phần lớn mạng.
  - Đặt key trong biến môi trường `VITE_METERED_APP`, `VITE_METERED_API_KEY`.
- **Vitest** để test phần mô phỏng.
- **Font**: VT323 (`@fontsource/vt323`), có hỗ trợ tiếng Việt.
- **Âm thanh**: ZzFX (thư viện tạo âm rất nhỏ, MIT). Tự chọn tham số cho các âm:
  - ném, nổ bóng, trúng, húc, rơi nước, ghi điểm (mỗi đội một tông);
  - bíp đếm ngược, còi bắt đầu;
  - nhạc báo điểm quyết định, nhạc thắng.

  `AudioContext` chỉ bật sau cú click đầu tiên của người chơi (luật autoplay của trình duyệt).
- Node LTS hiện hành, phiên bản mới nhất của các gói lúc cài.

### 8.2 Cấu trúc thư mục
```
src/
  main.ts                 khởi động, chuyển màn hình
  config.ts               TẤT CẢ hằng số mục 5
  sim/                    ★ thuần TS: không DOM, không mạng, không Math.random
    types.ts              PlayerState, BalloonState, RaftState, MatchState, InputFrame, GameEvent, Team
    world.ts              createMatch(seed, roster) và step(world, inputs, dt) → events[]
    movement.ts           di chuyển, va chạm người–người, thùng xốp, húc
    balloons.ts           bay, va chạm, nổ, văng (lọc theo phe)
    raft.ts               kích thước bè, lịch co, isOnRaft(x, y), khu nhà
    match.ts              máy trạng thái lobby → countdown → playing → golden → matchEnd, tỉ số, thống kê
    rng.ts                RNG có seed (mulberry32)
    bot.ts                bot sinh InputFrame từ world
  net/
    protocol.ts           kiểu tin nhắn, mã hóa và giải mã snapshot
    transport.ts          interface Transport
    trysteroTransport.ts  bản dùng Trystero
    localTransport.ts     bản dùng BroadcastChannel, để test nhiều tab offline
    ice.ts                lấy credential TURN
    hostSession.ts        sở hữu world, gom input, chạy tick, gửi snapshot và event
    clientSession.ts      gửi input, đệm snapshot, nội suy, dự đoán cho nhân vật mình
  render/
    renderer.ts           canvas 640×360, phóng to số nguyên, thứ tự vẽ theo y
    sprites.ts            nạp sprite sheet theo public/assets/manifest.json, chạy animation
    effects.ts            hạt nước, rung màn hình nhẹ, ô bè nhấp nháy
    overlay.ts            canvas thứ hai ở độ phân giải thật để vẽ chữ (bảng tên, HUD, banner)
  ui/                     màn hình DOM: trang chủ, sảnh chia đội, kết trận, menu Esc (CSS pixel)
  input/keyboardMouse.ts
  audio/sfx.ts
tests/                    test Vitest cho sim/
public/assets/            sprite, ô nền, manifest.json
```

### 8.3 Mô hình mạng
- **Topology**: Trystero nối tất cả với tất cả, nhưng game chỉ dùng hình sao. Client chỉ gửi cho chủ phòng (`target: hostId`) và bỏ qua tin từ client khác.
- **Một action Trystero duy nhất** tên `m`, gửi object `{k: <kind>, ...}`.
- **ID phòng Trystero**: `appId = "te-nuoc"`, `roomId = "v2-" + MÃ`. Mật khẩu (`password`) chính là mã phòng.
  - Mã phòng gồm 4 chữ in hoa, bỏ các chữ dễ nhầm I, O, 0, 1.
- **Phải chạy trên HTTPS** (hoặc localhost) vì mã hóa phiên dùng WebCrypto. Đó là lý do có CloudFront ở mục 9.

**Tạo phòng và vào phòng**
1. Người tạo phòng (host) sinh mã, join room, và đợi 1,5 giây. Nếu nhận được tin `lobby` của một host khác (mã bị trùng) thì sinh mã mới.
2. Người vào phòng join room rồi gửi `hello` cho mọi peer.
3. Chỉ host trả lời: `welcome` cho người mới, sau đó phát `lobby` cho tất cả.
4. Sau 8 giây không nhận được `lobby` thì báo "Không tìm thấy phòng".
5. Mỗi người (và bot) được host cấp một **slot 0–9**. Trong snapshot dùng slot thay cho peerId để tin nhắn gọn.

**Tin nhắn** (`v` = `PROTOCOL_VERSION`)

| Chiều | `k` | Nội dung | Tần suất |
|---|---|---|---|
| C→H | `hello` | `{v, name}` | 1 lần |
| C→H | `pick` | `{team}` | khi đổi đội |
| C→H | `in` | `{s: seq, mx, my, ax, ay, th, da}` | 30Hz |
| H→C | `welcome` | `{slot, hostId}` | 1 lần |
| H→C | `reject` | `{reason}` | |
| H→* | `lobby` | `{hostId, settings:{teamSize, scoreToWin, botFill}, players:[{slot,peerId,name,team,variant,isBot}], phase}` | khi có thay đổi |
| H→* | `start` | `{seed, roster}` | đầu trận |
| H→* | `snap` | snapshot dạng gọn (bên dưới) | 15Hz (mỗi 2 tick) |
| H→* | `ev` | `GameEvent[]` | ngay khi xảy ra |

Giải thích các trường trong `in`:
- `mx, my`: hướng di chuyển, đã chuẩn hóa.
- `ax, ay`: vị trí con trỏ trong tọa độ thế giới.
- `th`, `da`: **bộ đếm tăng dần** số lần đã bấm ném và bấm húc. Host so với giá trị lần trước để biết có lượt bấm mới. Nhờ vậy không cần gửi sự kiện riêng và không bao giờ mất lượt bấm.

Mỗi tick, host áp dụng input mới nhất của từng người. Input của chính host và của bot đưa thẳng vào world, không đi qua mạng.

**An toàn** (peer nào cũng gửi được dữ liệu tùy ý):
- Host kiểm tra mọi tin nhận được: đúng kiểu, `mx, my` kẹp trong [−1, 1] rồi chuẩn hóa, `th`/`da` chỉ được tăng và mỗi tick xử lý tối đa 1 lượt mỗi loại, tên cắt còn 12 ký tự.
- Tin sai định dạng thì bỏ qua.
- Tên người chơi chỉ được hiển thị qua `textContent` hoặc vẽ lên canvas, **không bao giờ** qua `innerHTML`.
- Tab mất focus thì client gửi hướng đi bằng 0.

**Snapshot gọn**: số nhân 10 rồi làm tròn thành số nguyên, gói trong mảng (không dùng object) để tiết kiệm băng thông upload của chủ phòng.
```
snap: { t: tick,
        p: [[slot, x10, y10, wet, state, flags, ackSeq, ammo, aimAngleByte, timer10], ...],
        b: [[id, x10, y10, ownerSlot, progressByte], ...],
        r: [raftW, raftH, warnOn], sc: [red, blue], ph: phase, tl: timeLeft10 }
```
- `state`: `alive | hitstun | dashing | falling | respawning | protected`.
- `timer10`: thời gian còn lại của trạng thái hiện tại (để HUD đếm ngược hồi sinh).
- `flags`: bit lật ngang sprite, bit đang ném (để chạy animation).
- Màu bóng suy ra từ đội của `ownerSlot`.
- `GameEvent` gồm:
  - `throw`, `burst{x,y,direct?}`, `hit{slot,wet,by}`;
  - `fall{slot,by}`, `score{team,red,blue}`, `respawn{slot}`, `streak{slot,n}`;
  - `matchPoint{teams}`, `lastMinute`, `golden`, `shrinkWarn`, `shrink`;
  - `matchEnd{winner, stats}`.

  Client dùng event để phát âm thanh và hiệu ứng **ngay tại tọa độ host gửi**. Không tự suy ra va chạm.

**Phía client**
- **Người khác và bóng**: vẽ ở thời điểm `now − 120ms`, nội suy tuyến tính giữa 2 snapshot. Hết dữ liệu thì ngoại suy tối đa 100ms rồi đứng yên.
- **Nhân vật của mình (dự đoán đơn giản)**:
  - Ở trạng thái `alive` hoặc `protected`: tự chạy `movement.ts` với input của mình (không tính va chạm người khác).
  - Mỗi snapshot: lấy vị trí đã dự đoán ứng với `ackSeq` (lưu lịch sử 1 giây) so với vị trí host gửi.
    - Lệch hơn 24px thì nhảy thẳng tới vị trí của host.
    - Lệch ít hơn thì kéo dần về, mỗi khung hình bù 20% phần lệch.
  - Khi state là `hitstun | dashing | falling | respawning`: **tắt dự đoán**, dùng trạng thái nội suy từ host, để cú bị đẩy luôn hiện đúng như host tính.
- **Ném bóng**: client vẽ ngay động tác ném, nhưng quả bóng chỉ xuất hiện khi snapshot hoặc event từ host tới. Không vẽ bóng "ảo" để tránh trúng oan.

**Phía host**
- Vòng lặp tick cố định 30Hz (`dt = 1/30`), dùng bộ tích lũy thời gian trên `performance.now()`. Cứ 2 tick gửi 1 snapshot (15Hz). Host vẽ trực tiếp từ world, không nội suy.
- Mỗi giây ping từng client một lần để hiện trong sảnh.
- Client rời đi (`onPeerLeave`):
  - Đang trong trận: xóa khỏi world, không tính điểm cho ai. Thay bằng bot nếu bật lấp bot.
  - Đang ở sảnh: xóa khỏi danh sách.
- **Host rời đi**: client nhận `onPeerLeave(hostId)` thì báo "Chủ phòng đã thoát" và quay về trang chủ. v1 không chuyển quyền chủ phòng.
- Trình duyệt bóp timer khi tab bị ẩn. Khi chủ phòng ẩn tab, hiện cảnh báo "Đừng chuyển tab khi đang làm chủ phòng". (M4: chuyển vòng tick sang Web Worker để hết bị bóp.)

### 8.4 Hiển thị
- Canvas game 640×360 phóng to **số nguyên** lớn nhất vừa cửa sổ, `image-rendering: pixelated`, `imageSmoothingEnabled = false`. Phần thừa để viền màu tối.
- Thứ tự vẽ:
  1. Nền và hồ (gợn nước động).
  2. Bọt quanh bè, rồi bè, vạch giữa, cờ đội.
  3. Bóng đổ, vòng màu đội dưới chân.
  4. Các thực thể, sắp theo `y` (người, thùng xốp, bóng nước đang bay).
  5. Hiệu ứng.
  6. Overlay chữ.
- Hiển thị độ ướt: sprite phủ màu xanh, độ đậm từ 0 tới tối đa 40% khi `wet` từ 0 tới 150. Thêm giọt nước nhỏ rơi từ người khi `wet > 50`.
- Rung màn hình 2px trong 0,15 giây khi **chính mình** bị trúng thẳng.
- Khi đội ghi điểm: bảng tỉ số nảy lên và nháy màu đội ghi điểm.

### 8.5 Đồ họa
- **Sprite nhân vật** 16×24, gốc tọa độ ở chân (giữa, đáy). Có **10 sheet**: `player_red_v0..v4.png` và `player_blue_v0..v4.png`. Mỗi sheet là một hàng khung hình:
  - `idle` ×2, `walk` ×4, `throw` ×3, `dash` ×1, `hit` ×1, `win` ×2 → 13 khung = 208×24px.
- **Các asset khác**:
  - Ô nước (4 khung), ván bè (thường / nứt / nhấp nháy), viền hồ, gạch tàu, đạo cụ.
  - Dải trời 640×52.
  - Thùng xốp 16×16, cờ đội 10×20 (đỏ, xanh).
  - Bóng nước 6×6 màu trắng, nhuộm màu đội lúc chạy. Hiệu ứng nổ 24×24 ×6 khung, cột nước khi rơi 24×32 ×6 khung.
- Đặt trong `public/assets/`, khai báo trong `public/assets/manifest.json`, gồm tên file, kích thước khung, số khung và fps.
- **Khi chưa có hoặc thiếu asset**: renderer vẽ thay bằng hình tròn màu đội. Nhờ vậy code được ngay, không phải chờ đồ họa.
- Người thiết kế sẽ vẽ và giao bộ asset nguyên bản theo đúng spec này, cùng với kế hoạch triển khai.

## 9. Triển khai lên S3
- Lệnh `npm run build` tạo `dist/`.
- **S3 bucket để private**, phía trước đặt **CloudFront** với Origin Access Control, `index.html` làm default root object, HTTPS bằng chứng chỉ mặc định `*.cloudfront.net` (có domain riêng thì dùng chứng chỉ ACM ở us-east-1).
- Script `scripts/deploy.sh`:
  1. `aws s3 sync dist/ s3://$BUCKET --delete`. File có hash dùng `Cache-Control: public,max-age=31536000,immutable`, còn `index.html` dùng `no-cache`.
  2. `aws cloudfront create-invalidation --paths /index.html`.
- Link phòng dùng hash (`#/r/ABCD`) nên không phải cấu hình rewrite cho SPA.

## 10. Kiểm thử
- **Test đơn vị cho `sim/`** (Vitest), tối thiểu gồm:
  - Công thức lực đẩy.
  - Bóng nổ khi hết tầm và khi trúng thùng.
  - Bóng xuyên qua đồng đội; nổ không ảnh hưởng đồng đội.
  - Trúng thẳng không gây văng thêm cho chính mục tiêu.
  - Ra khỏi bè thì rơi và đội kia +1 điểm, kể cả tự rơi.
  - Hồi sinh đúng khu nhà, bảo vệ chặn mọi lực đẩy, bấm ném thì mất bảo vệ.
  - Phút cuối co bè; hết giờ hòa thì vào bàn thắng vàng; điểm vàng kết thúc trận.
  - Thắng khi đủ `SCORE_TO_WIN`.
  - `th`/`da` không mất lượt.
  - Seed giống nhau thì kết quả giống nhau.
- **Thử nhiều người trên một máy**: dùng `?net=local` để chạy `localTransport` (BroadcastChannel) qua nhiều tab.
- **Thử tải**: chạy `?bots=9` để có phòng 1 người + 9 bot (5v5). Kiểm tra độ dài trận và độ sát tỉ số theo chỉ tiêu ở mục 5.
- **Thử thật trước khi gửi bạn bè**: 3 máy khác mạng, trong đó ít nhất một máy dùng 4G. Xác nhận vào được phòng, chia đội, chơi hết một trận, và host thoát thì client nhận được thông báo.

## 11. Các cột mốc
- **M1 — Chơi được với bot**: sim (đội, rơi, hồi sinh, tỉ số, thùng xốp) + renderer + input, chạy offline. Có test sim.
- **M2 — Online**: Transport (local + Trystero), sảnh chia đội, host/client, snapshot, nội suy, dự đoán.
- **M3 — Thành game hoàn chỉnh**: phút cuối, bàn thắng vàng, chuỗi nóng tay, HUD, banner, danh hiệu, âm thanh, asset thật, deploy S3.
- **M4 — Đánh bóng**: va chạm dây chuyền, tick trong Web Worker, hiệu ứng thêm, tinh chỉnh số theo chỉ tiêu.

## 12. Phần để người code tự quyết
- Cách tổ chức code bên trong mỗi file và module, mã hóa snapshot chi tiết (giữ đúng các trường ở trên).
- CSS của các màn hình DOM, miễn theo phong cách pixel và dùng font VT323.
- Tham số âm thanh ZzFX, chi tiết hạt nước và hiệu ứng.
- Cách viết AI bot cụ thể, miễn đúng các hành vi ở mục 4.9.
- Tinh chỉnh mọi con số trong `config.ts` để đạt chỉ tiêu ở mục 5.
