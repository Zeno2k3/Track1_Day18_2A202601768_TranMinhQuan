# AI Support Log

**Người nộp:** Trần Minh Quân (2A202601768)  
**Công cụ:** Claude (Claude Code, agent trên repo này).

Log này là phản ánh **của tôi**, không copy log teammate.

---

## AI đã giúp gì

1. **Option A (AI Notes):** luồng 1-click bắt dấu vết trên slide/transcript; AI dựng bản nháp tổng hợp sau bài có dẫn chứng (quote + timestamp), tua được về chỗ gốc; màn duyệt Đúng / Sửa / Bỏ cho từng ý trước khi lưu; badge "AI suy luận thêm" khi không có câu nào nói thẳng trong bài; nút Tạo lại bản nháp / Khôi phục bản trước khi lưu.
2. **Shared shell:** splitter kéo slide / transcript / rail; token màu 3 loại note; banner tĩnh hướng dẫn thao tác; cache-bust CSS/JS để lúc test không dính bản cũ.
3. **Git:** gộp `main` vào `feature/template` để B và C của teammate nằm cùng shell với A; push nhánh; mở [PR #2](https://github.com/Zeno2k3/Track1_Day18_2A202601768_TranMinhQuan/pull/2).
4. **Nộp bài:** khung README 6 phần và các file `.md` theo đề — tôi cung cấp hypothesis nhóm, phân vai A/B/C, observation phiên test; AI soạn cấu trúc, tôi giữ số liệu theo slide/synthesis nhóm.

---

## Chỗ AI sai hoặc hời hợt

| Lần | Việc AI làm | Vì sao không dùng nguyên |
|---|---|---|
| 1 | Viết lại luôn B và C cho "đồng bộ UX" với A | B/C là của teammate. Dùng sẽ phá comparison contract và đóng góp người khác. |
| 2 | Nút "Dùng thử dữ liệu mẫu" to, video slide tự phát | Tester tưởng đó là task; demo ồn. Không phải luồng học thật. |
| 3 | Notify nền tối, chữ nặng | Trông như lỗi/cảnh báo, không phải coach. |
| 4 | Banner động rồi biến mất | Tester cần đọc lại bước; banner phải **để yên** trên panel. |
| 5 | Bản nháp AI diễn giải câu tester nói thành ý mới thay vì trích lại đúng ý | Sai nguyên tắc evidence — nháp phải bám câu gốc, không được "sáng tác thêm" rồi gắn dẫn chứng. |
| 6 | Dump file tiếng Việt qua PowerShell sai encoding | Chữ trong `branches.js` hỏng — không commit bản đó. |

AI cũng hay **kết luận hộ** ("nên ship A") — trái Gate 5. Kết luận nhóm chỉ dựa trên pause / Sửa / tắt nhắc, ghi ở synthesis.

---

## Tôi tự sửa / chặn

* Yêu cầu giữ nguyên B, C trên `main`; A chỉ trên `feature/template`.
* Bỏ nút dữ liệu mẫu; AI Notes chỉ **nạp nhẹ vài dấu vết mồi**, không tự phát video/slide.
* Đòi banner tĩnh + notify sáng, viền indigo/xanh/vàng nhạt.
* Bắt nháp AI **trích đúng câu gốc** kèm timestamp, không diễn giải thêm rồi gắn nhãn dẫn chứng.


---

## Giới hạn còn lại

AI không dự phiên test. Mọi first action / số lần pause / câu tester là **quan sát của facilitator**, không phải AI bịa. Chỗ tôi không có số liệu riêng (ví dụ "Sửa đúng 20%") thì để mức nhóm đã ghi trên slide, không làm tròn thành validation.
