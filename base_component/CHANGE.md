# CHANGE.md — VLearn Prototype UI/UX

Cập nhật: 2026-08-18 (v=6)

**Hard-refresh `Ctrl+F5`** tại `http://localhost:8018`.

---

## Thông báo động + banner tĩnh

- Banner tĩnh (💡 / 📝 / 🔔) **giữ trên panel** để đọc lại bất cứ lúc nào.
- Thông báo động nổi góc phải: nền **sáng**, viền indigo/xanh nhạt, chữ đậm — không còn nền tối.
- Đã **bỏ** nút ⚡ Dùng thử dữ liệu mẫu.

---

## Cơ chế chung: dùng đến đâu thì hiện đến đấy

- Slide / transcript chỉ hiện nội dung slide đang học.
- Dấu vết *có sẵn* (seed) chỉ xuất hiện trên danh sách AI Notes khi đã đi tới đúng slide đó.
- Ghi chú **vừa thêm** luôn hiện ngay trên cùng danh sách.
- Tab **Sau bài học** khóa đến khi tới slide cuối. Dòng tiến độ dưới tab: `đã xem x/8`.

Kéo dãn khung (áp dụng cả 3 nhánh):

- Thanh dọc giữa slide và panel ghi chú — đổi độ rộng panel.
- Thanh ngang giữa slide và transcript — đổi chiều cao.

---

## AI Notes

| # | Yêu cầu | Cách làm |
|---|---------|----------|
| 1.1 | Slide cuối → hướng dẫn sang "Sau bài học" | Toast xanh + banner + nút **Sang tab Sau bài học**. Tab bị khóa trước đó. |
| 1.2 | Kéo dãn component | Splitter dùng chung (xem trên). |
| 1.3 | Chỉ dẫn ngay khi vào | Banner `💡 Cách dùng: Bôi đen…` ở đầu panel. |
| 1.4 | 3 màu rõ | **Quan trọng** vàng `#FEF3C7/#D97706`, **Chưa hiểu** cam `#FFEDD5/#EA580C`, **Ghi chú** indigo `#EEF2FF/#4F46E5`. Nút + thẻ + badge cùng bộ màu. |
| 1.5 | List theo lúc thêm, không theo A/B/C | Sort `createdAt` mới nhất lên trên. Không group theo loại. |
| 1.6 | Bản tổng hợp có cấu trúc | 📌 Ý chính cốt lõi · ❓ Điểm chưa hiểu · 🎯 Hành động / Bài tập. Tự chạy khi mở tab Sau bài học. |

Nút **⚡ Dùng thử dữ liệu mẫu** để tester không cần bôi đen thủ công.

---

## Template

| # | Yêu cầu | Cách làm |
|---|---------|----------|
| 1.7 | Kéo dãn | Splitter dùng chung. |
| 1.8 | Chỉ dẫn ngay khi vào | Banner `📝 Hướng dẫn: … + Thêm hoặc Enter … Xem tổng hợp`. |
| 1.9 | 4 ô khó dùng | Đổi thành **3 tab**: Ý chính · Chưa hiểu · Việc cần làm. Ô rộng + nút `+ Thêm vào Note`. |
| 1.10 | Gợi ý khi gõ, lấy từ slide | Dropdown kiểu VSCode. Slide 1 gõ `M` → *Mục tiêu của học máy là tổng quát hoá…*. ↑↓ chọn, Tab nhận, Enter nhận và thêm. |
| 1.11 | Báo thêm thành công + xem tổng hợp | Toast `Đã thêm vào [mục] (Mốc mm:ss)`. Nút **📋 Xem tổng hợp bản ghi chú** chuyển sang bảng 3 mục. |
| 1.14 | Dễ test | **Tự nạp 3 ghi chú mẫu** khi mở Template (mỗi tab đã có 1 dòng). Vẫn còn nút nạp lại cho tester. |

---

## Nhắc ôn

| # | Yêu cầu | Cách làm |
|---|---------|----------|
| 1.12 | Kéo dãn | Splitter dùng chung. |
| 1.13 | Chỉ dẫn ngay khi vào | Banner `🔔 Cách dùng: … điểm Chưa hiểu ở Nhánh 1 & 2…`. |
| 1.14 | Dễ test | Nút **⚡ Dùng thử dữ liệu mẫu** nạp thẻ ôn nếu kho còn trống. |

---

## File đã sửa

- `index.html` — cache-bust `?v=4`
- `css/tokens.css` — token màu 3 loại ghi chú
- `css/base.css` — splitter slide / transcript / rail
- `css/components.css` — banner, màu note, dropdown gợi ý
- `js/fixtures.js` — `suggestions`, `samplePack`
- `js/components.js` — `guideBanner`, `suggestField`
- `js/app.js` — `createdAt`, `maxSlideIndex`, kéo dãn
- `js/branches.js` — logic 3 nhánh

---

## Cách test nhanh

1. Mở `http://localhost:8018` rồi `Ctrl+F5`.
2. **AI Notes:** thấy banner + 3 nút màu. Bấm slide tới cuối → toast/banner, tab Sau bài học mở, bản ghi chú 3 mục.
3. Kéo thanh xám giữa slide và transcript, và giữa slide và panel phải.
4. **Template:** mỗi tab đã có 1 note mẫu. Gõ `M` trên slide 1 → dropdown gợi ý. Thêm → toast. Bấm **Xem tổng hợp**.
5. **Nhắc ôn:** thấy banner; nạp mẫu rồi **Tua tới mốc nhắc**.
