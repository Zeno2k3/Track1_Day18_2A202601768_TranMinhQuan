# Track 1 · Day 18 — Multiple Prototypes & Human–AI Design

Repo cá nhân: `Track1_Day18_2A202601768_TranMinhQuan`

## 1. Thông tin cá nhân và nhóm

* **Lớp:** Khoá 4 (K4) — VLearn Codelabs
* **Họ và tên:** Trần Minh Quân
* **Mã học viên (MHV):** 2A202601768
* **Tên nhóm:** Nhóm E2
* **Case:** Case A — AI Notes: Personal Learning Notes
* **Thành viên:**
  1. **2A202601768 — Trần Minh Quân** — Option A: AI Notes; shared shell (splitter, màu note, banner); facilitate 1 phiên test
  2. **2A202601648 — Trần Thị Hường** — Option B: Structured Note Template
  3. **2A202601624 — Nguyễn Đức Anh** — Option C: Spaced Repetition Reminder

Ba thành viên dùng chung Design Sheet, bộ prototype A/B/C và Group Feedback Synthesis. File trong repo này phản ánh **đóng góp và phiên facilitate của Trần Minh Quân**.

| Artifact | File / link |
|---|---|
| Design Sheet | [three-option-design-sheet.md](./three-option-design-sheet.md) · [Google Docs nhóm](https://docs.google.com/document/d/1DrYW34bF2Alx85sDRTRklhkQOZyJwq20dTLwp5t13ZQ/edit?tab=t.8hk9b0yl75jw) |
| Prototype A/B/C | [prototype-link.md](./prototype-link.md) |
| Feedback Note (phiên tôi facilitate) | [prototype-feedback-note.md](./prototype-feedback-note.md) |
| Group Feedback Synthesis | [group-feedback-synthesis.md](./group-feedback-synthesis.md) |
| AI Support Log | [ai-support-log.md](./ai-support-log.md) |

---

## 2. Hypothesis Problem

> **Khi** vừa xong một bài học có nhiều nội dung kỹ thuật mới hoặc còn phần chưa hiểu, **học viên** khó **hệ thống lại ý trọng tâm và điểm cần làm rõ để ôn**, vì **dấu vết (highlight, câu hỏi, ghi chú) nằm rời, thiếu ngữ cảnh, và vừa nghe vừa tự chép làm phân tán tập trung**, nên **mất nhiều thời gian hơn dự kiến để tổng hợp; bản ghi chú rải, khó dùng lại — hoặc không được mở, hoặc không giúp nhớ lâu hơn.**

**Dấu vết từ Day 17 (Evidence Continuity)**

* Học viên từng **dừng / tua lại** slide hoặc video chỉ để kịp chép — situation có thật; ghi chép thủ công cạnh tranh với nghe giảng.
* Workaround rời rạc (chụp màn hình, Notion/Word song song, sổ tay, extension) — nhu cầu lưu kiến thức có thật, chưa có một luồng gọn trong buổi học.
* Có trường hợp chép xong **không mở lại** — consequence “ghi chú rải → khó ôn” không chỉ là phàn nàn lúc học.

**Điều chưa biết (không coi Practice Notes là validation)**

* Gõ tay lúc học làm **hiểu bài kém hơn**, hay chỉ khó chịu / mất thời gian?
* Nếu có bản ghi chú có cấu trúc, học viên **có mở lại** — hay rào cản chính là thiếu động lực ôn (Pain B)?
* Học viên **có tin** bản AI tổng hợp đủ đúng để thay ghi chú tự viết?

---

## 3. Three Solution Options

Cùng **user, situation, task, content, desired outcome**. Khác nhau ở **cơ chế** và **cách chia việc user–AI**, không phải layout/màu/chữ.

* **User:** học viên có thói quen highlight / ghi chú / đặt câu hỏi lúc học.
* **Situation:** buổi học trực tuyến nhiều nội dung kỹ thuật mới, còn chỗ chưa hiểu.
* **Task:** biến dấu vết lúc học thành tài liệu dùng lại để ôn và làm bài.
* **Outcome:** nhận ra ý trọng tâm và phần chưa hiểu; dùng lại được mà không đọc lại cả buổi. Fixture: `ml-04 Overfitting & Regularization`, 45 phút, 8 slide, 24 dòng transcript.

| | Option A · AI Notes *(tôi phụ trách)* | Option B · Template | Option C · Reminder |
|---|---|---|---|
| **Cơ chế** | 1-click bắt dấu vết → AI dựng nháp có dẫn chứng → user duyệt Đúng/Sửa/Bỏ rồi mới lưu | Khung Ý chính / Chưa hiểu / Việc cần làm; user tự gõ; gợi ý từ slide; không AI | Lịch nhắc (cố định hoặc AI chọn mốc) + mở lại ghi chú / thẻ ôn |
| **User** | Bôi đen trên slide/transcript; duyệt bản nháp | Điền 3 mục trong lúc nghe | Chọn lịch, bật/tắt nhắc, mở ôn hoặc để sau |
| **AI** | Ask: chỉ nháp, có evidence + cờ suy luận | Don't act | Act: chủ động nhắc; user đổi lịch / tắt / lịch sử |
| **Link** | `#ai-notes` | `#template` | `#reminder` |

Chi tiết Human–AI (expectation, agency, evidence, recovery): [three-option-design-sheet.md](./three-option-design-sheet.md). Cách mở A/B/C: [prototype-link.md](./prototype-link.md).

---

## 4. Đóng góp của tôi trong nhóm

* **Thiết kế và dựng Option A — AI Notes (Co-create):** luồng 1-click bắt dấu vết trên slide/transcript → sau bài AI dựng nháp có dẫn chứng (quote + timestamp) → user duyệt từng ý theo Đúng/Sửa/Bỏ rồi mới lưu; badge "AI suy luận thêm" khi không có câu nói thẳng trong bài; nút Tạo lại / Khôi phục bản trước khi lưu — theo đúng phân công tại mục 3.
* **Shared shell dùng chung cho A/B/C:** xây `base_component/index.html` và splitter, hệ màu note, banner hướng dẫn thao tác — hạ tầng chung để cả 3 option chạy trên cùng một shell, cùng fixture `ml-04`, chuyển bằng hash URL (`#ai-notes`, `#template`, `#reminder`).
* **Facilitate 1 phiên test:** dẫn phiên thử A/B/C với tester, ghi observation (dùng 1-click rồi sửa vài ý ở A, tester pause 4–5 lần ở B, tắt notification ở C) — chi tiết ở [prototype-feedback-note.md](./prototype-feedback-note.md).
* **Gộp và giữ nguyên đóng góp của đồng đội khi merge git:** hợp nhất nhánh giữ Option B và C của teammate cùng Option A của mình trên `main`/`feature/template`, sửa lỗi lần đầu viết đè lên B và C, rồi push và mở PR #2 — chi tiết ở [ai-support-log.md](./ai-support-log.md).
* **Tổng hợp kết quả nhóm:** tham gia synthesis 3 bộ feedback, đề xuất hướng tiếp theo kết hợp **A + C** dựa trên evidence từ phiên test (không chọn B làm hướng chính) — xem mục 5 và [group-feedback-synthesis.md](./group-feedback-synthesis.md).

---

## 5. Prototype Feedback

Phiên **tôi** facilitate: [prototype-feedback-note.md](./prototype-feedback-note.md).

* **Observation:** Tester vào C trước (công tắc lịch). Ở B phải **pause bài 4–5 lần** để gõ. Ở A dùng 1-click rồi **Sửa** vài ý AI. Ở C hỏi *“note xấu thì nhắc để làm gì”*, từng **tắt thông báo**.
* **Ba-feedback synthesis (nhóm):** 3/3 nắm UI nhờ banner; gõ tay ở B làm đứt nghe giảng; 3/3 đòi duyệt AI; ưu tiên A, phiên tôi nghiêng **A + C**. Chi tiết: [group-feedback-synthesis.md](./group-feedback-synthesis.md).
* **Next Change:** kết hợp **A + C** — AI Notes tạo ghi chú đã duyệt → làm thẻ/đầu vào lịch nhắc. **Không** chọn B làm hướng chính (pause 4–5 lần là evidence, không phải “tester thích A”).
* **Still Unproven:** thói quen mở lại sau **14–30 ngày** — buổi test ~20 phút chỉ đo hành vi lúc đó.

---

## 6. AI Support Log

Rút gọn; nhật ký đầy đủ: [ai-support-log.md](./ai-support-log.md).

* **Giúp:** dựng UX Option A (bắt dấu vết, nháp AI có dẫn chứng, duyệt Đúng/Sửa/Bỏ, splitter, banner); gộp git giữ B/C trên `main`; push và mở PR.
* **Hời hợt / sai:** lần đầu viết đè B và C; notify nền tối; nút dữ liệu mẫu quá nổi; AI kết luận hộ nên chọn hướng nào.
* **Tôi sửa / chặn:** yêu cầu giữ nguyên B/C teammate; bỏ nút mẫu; giữ banner tĩnh; notify sáng; để kết luận nhóm tự dựa trên evidence, không theo gợi ý AI.
