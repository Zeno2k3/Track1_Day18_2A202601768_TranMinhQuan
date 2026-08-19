# AI Support Log

**Người nộp:** Trần Minh Quân (2A202601768)  
**Công cụ:** Cursor (agent trên repo này). Không dùng AI để viết hộ kết luận “B đã validated”.

Log này là phản ánh **của tôi**, không copy log teammate.

---

## AI đã giúp gì

1. **Option B (Template):** tab Ý chính / Chưa hiểu / Việc cần làm; gợi ý cụm từ từ slide kiểu VSCode; toast khi thêm; màn xem tổng hợp; banner tĩnh; notify nền sáng.
2. **Shared shell:** splitter kéo slide / transcript / rail; token màu 3 loại note; cache-bust CSS/JS để lúc test không dính bản cũ.
3. **Git:** gộp `main` vào `feature/template` để A và C của teammate nằm cùng shell với B; push nhánh; mở [PR #2](https://github.com/Zeno2k3/Track1_Day18_2A202601768_TranMinhQuan/pull/2).
4. **Nộp bài:** khung README 6 phần và các file `.md` theo đề — tôi cung cấp hypothesis nhóm, phân vai A/B/C, observation phiên test; AI soạn cấu trúc, tôi giữ số liệu theo slide/synthesis nhóm.

---

## Chỗ AI sai hoặc hời hợt

| Lần | Việc AI làm | Vì sao không dùng nguyên |
|---|---|---|
| 1 | Viết lại luôn A và C cho “đồng bộ UX” với B | A/C là của teammate. Dùng sẽ phá comparison contract và đóng góp người khác. |
| 2 | Nút “Dùng thử dữ liệu mẫu” to, video slide tự phát | Tester tưởng đó là task; demo ồn. Không phải luồng học thật. |
| 3 | Notify nền tối, chữ nặng | Trông như lỗi/cảnh báo, không phải coach. |
| 4 | Banner động rồi biến mất | Tester cần đọc lại bước; banner phải **để yên** trên panel. |
| 5 | Gộp nhánh lần đầu lấy **stub A** trên `main` cũ | Teammate đã merge A đầy đủ; stub không phải option A đi test. |
| 6 | Dump file tiếng Việt qua PowerShell sai encoding | Chữ trong `branches.js` hỏng — không commit bản đó. |

AI cũng hay **kết luận hộ** (“nên ship A”) — trái Gate 5. Kết luận nhóm chỉ dựa trên pause / Sửa / tắt nhắc, ghi ở synthesis.

---

## Tôi tự sửa / chặn

* Yêu cầu giữ nguyên A, C trên `main`; B chỉ trên `feature/template`.
* Bỏ nút dữ liệu mẫu; Template chỉ **nạp nhẹ 1 dòng/tab** để trống panel không đơ, không giả hoàn thành task.
* Đòi banner tĩnh + notify sáng, viền indigo/xanh/vàng nhạt.
* Bắt lấy **đúng A hiện tại trên `main`**, không dùng stub.
* Tự chạy lại A/B/C trên localhost trước khi nhờ push PR.
* README: đổi từ bản copy nhầm (tên Hường, nhận nhầm option) sang **MHV 2A202601768, option B**.

---

## Giới hạn còn lại

AI không dự phiên test. Mọi first action / số lần pause / câu tester là **quan sát của facilitator**, không phải AI bịa. Chỗ tôi không có số liệu riêng (ví dụ “Sửa đúng 20%”) thì để mức nhóm đã ghi trên slide, không làm tròn thành validation.
