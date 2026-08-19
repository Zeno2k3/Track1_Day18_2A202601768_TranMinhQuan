# Group Feedback Synthesis

Artifact tổng hợp chung Nhóm 2 (Day 18). Ba Feedback Notes: phiên Hường facilitate, phiên Đức Anh facilitate, phiên **Trần Minh Quân** facilitate ([prototype-feedback-note.md](./prototype-feedback-note.md)).

Cả ba tester **ngoài nhóm**, mỗi người dùng đủ A/B/C, cùng task và fixture.

Không tổng hợp kiểu “3 tester thích B”. Dưới đây là **pattern / khác biệt**, rồi **Next Change** và **Still Unproven**.

---

## Pattern và khác biệt

| | Phiên Hường | Phiên Đức Anh | Phiên Quân | Pattern / khác biệt |
|---|---|---|---|---|
| **First action** | Thử bôi đen ở A và gõ gợi ý ở B | Bấm bắt dấu vết ở A ngay | Vào **C trước** (công tắc lịch) | 3/3 đọc được panel nhờ banner; **không** cùng cửa vào — 1/3 bắt đầu từ nhắc ôn, không từ tạo note |
| **Breakdown** | Pause ~4 lần khi gõ B; do dự vài giây khi đọc nháp A | Lúng túng khi gõ B dù có autocomplete; thừa ý AI thì **Bỏ** | Pause 4–5 lần ở B; C: “note xấu thì nhắc làm gì” | **Gõ B làm đứt buổi học** (pause lặp, 3 phiên). A: ma sát ở **rà soát**, không ở lúc nghe |
| **Lấy lại control** | **Sửa** ý AI | **Bỏ** ý AI thừa | Tắt notification C; Sửa ở A; xem tổng hợp B | 3/3 **dùng** control, không chỉ nhìn thấy nút |
| **Hướng tester nghiêng** | A | A | **A + C** | 3/3 không chọn B làm cách chính. Khác biệt: phiên Quân **nối C với chất lượng note**, không dừng ở “A nhanh hơn” |

**Option B (baseline không AI):** ưu — kiểm soát nội dung. Nhược quan sát được — pause 4–5 lần, ~3–4 phút gõ. Dùng B để **xác nhận pain gõ tay**, không phải ứng viên ship.

**Option A:** 1-click không cắt nghe; tester giữ phần lớn ý, **Sửa ~một phần** vì diễn đạt. Human control là điều kiện, không optional.

**Option C:** 2/3 bấm mở ôn khi có nhắc (theo slide nhóm). Điều kiện testers nêu: note đầu vào phải cô đọng — trùng hypothesis Pain B phụ thuộc Pain A, **chưa** chứng minh thói quen 14–30 ngày.

---

## Next Change (quyết định nhóm, không nói quá evidence)

**Kết hợp Option A + Option C.**

1. Dùng AI Notes để bắt dấu vết lúc học và có bản ghi chú **đã user duyệt** sau bài.
2. Đưa đúng bản đó vào lịch nhắc / thẻ ôn (C).

**Evidence đủ để quyết định này, không đủ để tuyên bố product-market fit:**

* B: pause lặp ở cả 3 phiên → không chọn B làm hướng chính (so sánh mechanism, không phải đếm like).
* A: tạo note nhanh hơn gõ B **và** tester vẫn sửa/bỏ → giữ Ask, không để AI tự lưu.
* C: có hành vi mở khi được nhắc, kèm điều kiện note không rác → C đi sau A, không thay A.

Không tuyên bố “solution đã validated”.

---

## Still Unproven

* Duy trì mở lại sau **14–30 ngày** trên sản phẩm thật — phiên ~20 phút chỉ đo first action / pause / duyệt AI.
* Gõ template **sau** buổi (không song song nghe) có còn pain không — chưa test.
* Tỉ lệ mở mốc C khi note đến từ A đã duyệt vs note rời — chuỗi A→C mới là next prototype, chưa chạy dài.

Board / slide cùng nội dung: [Google Docs](https://docs.google.com/document/d/1DrYW34bF2Alx85sDRTRklhkQOZyJwq20dTLwp5t13ZQ/edit?tab=t.8hk9b0yl75jw) · [`slides_2.html`](./slides_2.html)
