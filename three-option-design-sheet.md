# Three-option Design Sheet

Bản trong repo (cùng nội dung nhóm dùng Day 18). Board chung: [Google Docs nhóm](https://docs.google.com/document/d/1DrYW34bF2Alx85sDRTRklhkQOZyJwq20dTLwp5t13ZQ/edit?tab=t.8hk9b0yl75jw).

**Case:** A — AI Notes: Personal Learning Notes  
**Nhóm E2**  
Trần Minh Quân (A) · Trần Thị Hường (B) · Nguyễn Đức Anh (C)

---

## Comparison contract — giữ nguyên cho A, B, C

| | Chung |
|---|---|
| **User** | Học viên có thói quen highlight, ghi chú, đặt câu hỏi hoặc lưu nội dung lúc học |
| **Situation** | Buổi học trực tuyến nhiều nội dung kỹ thuật mới, còn chỗ chưa hiểu |
| **Task** | Biến dấu vết lúc học thành tài liệu dùng lại để ôn và làm bài |
| **Desired outcome** | Nhận ra ý trọng tâm và phần chưa hiểu; dùng lại được mà không đọc lại cả buổi (≤ 3 phút sau bài có bản tin được ≥ 80% ý; lúc ôn mở ra dùng dưới 3 phút) |
| **Content / fixture** | `ml-04` Overfitting & Regularization, 45 phút, 8 slide, 24 dòng transcript, kho `marks` dùng chung |

Khác nhau nằm ở **mechanism** và **chia việc user–AI**, không phải layout / màu / wording.

---

## Ba option

### A · AI Notes (Co-create) — Trần Minh Quân

* **Mechanism:** 1-click bắt dấu vết trên slide/transcript → sau bài AI dựng nháp có dẫn chứng → user duyệt từng ý rồi mới lưu.
* **Pain đánh:** mất công gom highlight/câu hỏi rời sau buổi học.
* **Trade-off:** nhanh; AI có thể diễn đạt chưa đúng ý cá nhân.

### B · Structured Template (Human-led) — Trần Thị Hường

* **Mechanism:** khung cố định Ý chính / Chưa hiểu / Việc cần làm; user tự gõ lúc nghe; gợi ý cụm từ từ slide (không sinh nội dung hộ).
* **Pain đánh:** ghi chú thiếu cấu trúc ngay từ lúc tạo; kiểm chứng xem **khung** có đủ hay **khâu gõ** vẫn làm phân tán.
* **Trade-off:** kiểm soát 100%; tăng thao tác và tải nhận thức lúc học.

### C · Spaced reminder (System Act) — Nguyễn Đức Anh

* **Mechanism:** lịch D+1 / D+3 / D+7 (cố định hoặc AI chọn mốc) + thông báo + mở lại ghi chú/thẻ ôn.
* **Pain đánh:** lưu xong không quay lại (Pain B), tách khỏi Pain A (chất lượng note).
* **Trade-off:** tăng khả năng mở lại; **không** sửa chất lượng ghi chú gốc.

---

## Human–AI design (Gate 3)

| | A · AI Notes | B · Template | C · Reminder |
|---|---|---|---|
| **Expectation** | AI chỉ ra **nháp**, chưa lưu; có callout “chưa được lưu, hãy rà soát”. | Hệ thống **không viết hộ**; placeholder + banner “gõ / Enter / xem tổng hợp”. | Thông báo nêu **mốc + bài**; AI mode giải thích vì sao chọn mốc. |
| **Agency** | **Ask:** Đúng / Sửa / Bỏ từng ý; thêm ý của user. | **Don't act:** user nhập, sửa, xóa; gợi ý chỉ nhận khi user chọn. | **Act:** hệ thống gửi nhắc. User bật/tắt, đổi tần suất, lịch cố định ↔ AI, mở ngay / để sau. |
| **Evidence** | Dẫn chứng timestamp + quote; tua về chỗ gốc. | Evidence = chính câu user gõ, neo slide/thời điểm. | Evidence = mốc trên lịch + dấu vết đã lưu từ A/B. |
| **Uncertainty** | Badge “AI suy luận thêm” khi không có câu nào trong bài nói thẳng. | User tự để ý vào tab Chưa hiểu nếu chưa chắc. | User thấy lịch AI vs cố định; không giả định note đã đủ tốt. |
| **Recovery** | Tạo lại bản AI; Khôi phục về bản vừa dựng; sửa trực tiếp; không lưu nếu chưa duyệt. | Sửa/xóa dòng; quay lại từ màn tổng hợp; Undo trình duyệt khi gõ. | Tắt nhắc; đổi lịch; lịch sử ôn nếu lỡ dismiss; tua lại đoạn bài khi không nhớ. |

---

## Vì sao đủ khác để so sánh (Gate 2)

Không phải ba skin cùng một form.

* A: AI **tổng hợp sau bài**, user duyệt.
* B: user **cấu trúc lúc học**, không AI.
* C: không tạo note mới; **kích hoạt quay lại** theo thời gian.

Cùng task “có tài liệu ôn được” → đo được: số lần pause (B), tỉ lệ giữ/sửa/bỏ ý AI (A), tỉ lệ mở mốc nhắc (C).
