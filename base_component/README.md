# Base — Màn hình buổi học cho 3 nhánh prototype

Trang nền dùng chung để 3 prototype chạy trên **cùng một sân**: cùng màn hình, cùng dữ liệu,
cùng bộ component. Khác nhau chỉ ở phần nhánh tự viết — nhờ vậy kết quả test mới so sánh được.

## Chạy

```bash
cd base_component
python3 -m http.server 8018
# mở http://localhost:8018  ·  chọn nhánh ở góc phải trên, hoặc dùng #ai-notes / #template / #reminder
```

Không có bước build, không phụ thuộc package nào.

## 4 thứ được chia sẻ

| Thành phần | File | Ghi chú |
|---|---|---|
| **Context screen** | `js/app.js` + `css/base.css` | Topbar bài học · thanh Task/Outcome · slide stage · player có timeline · transcript · rail bên phải cho nhánh |
| **Content / data fixture** | `js/fixtures.js` | 1 buổi học ML 45 phút: 8 slide, 24 dòng transcript có timestamp, 5 dấu vết mồi, `goldenSummary` để đối chiếu. **Không nhánh nào được sửa file này.** |
| **Component & visual style** | `css/tokens.css`, `css/components.css`, `js/components.js` | Token (màu/spacing/typo/motion) → component (btn, card, badge, slide, player, transcript, note, empty, toast, skeleton, form) → helper `UI.*` |
| **Task & desired outcome** | khai báo trong `js/branches.js` | Hiển thị luôn trên thanh dưới topbar, đổi theo nhánh đang chạy |

Mỗi nhánh tự in chỉ số đo được xuống chân panel bên phải (số dấu vết, tỉ lệ chấp nhận,
số lần dừng bài, tỉ lệ mở lại…) để buổi test không phải bấm giờ bằng tay.

## Ba nhánh = ba hướng giải quyết

| | Hướng | AI? | Task | Desired outcome | Giả thuyết đang kiểm chứng |
|---|---|---|---|---|---|
| **1 · AI Notes** | Highlight + nhãn "Chưa hiểu" + ghi chú ngắn trong lúc học → AI tổng hợp sau bài → học viên sửa & xác nhận | Có | Bắt dấu vết trong lúc học, để AI tổng hợp rồi duyệt lại | Bản ghi chú xong trong ≤ 3 phút sau bài, xác nhận ≥ 80% ý | Học viên có tin bản AI tổng hợp là "đủ đúng" để thay ghi chú tự tay? |
| **2 · Template** | Khung cố định Ý chính / Câu hỏi / Chưa hiểu / Việc cần làm, tự điền tay | Không | Điền 4 mục ngay trong lúc nghe giảng | Điền cả 4 mục trước khi bài kết thúc, không dừng/tua lại | Chỉ cần cái khung là đủ, hay khâu gõ tay vẫn làm phân tán sự tập trung? |
| **3 · Nhắc ôn** | Nhắc quay lại mở ghi chú theo mốc ghi nhớ, có công tắc lịch cố định ↔ AI chọn thời điểm | Tuỳ chọn | Nhận nhắc đúng lúc và mở lại ghi chú để ôn | Mở lại ở ≥ 2/3 mốc đầu, mỗi lượt ôn < 3 phút | Rào cản thật là chất lượng ghi chú (Pain A) hay động lực quay lại ôn (Pain B)? |

Ba nhánh dùng chung kho `marks`, nên chúng nối được thành một chuỗi test: ghi chú tạo ở
hướng 1 hoặc 2 trở thành thẻ ôn của hướng 3 — đúng thứ tự mà học viên thật sẽ trải qua.
Hướng 3 có sẵn hai chế độ trong một panel để so lịch cố định với AI mà không cần tách thêm nhánh.

## Tách nhánh

`js/branches.js` là **file duy nhất mỗi nhánh được sửa**. Ba stub hiện tại chạy được, dùng làm điểm xuất phát.

```bash
git checkout -b proto/1-ai-notes   # rồi chỉ sửa mount() của nhánh tương ứng trong js/branches.js
```

Nếu một nhánh cần thêm component, thêm vào `css/components.css` + `js/components.js` rồi
merge ngược về base để hai nhánh kia cũng có — đừng để mỗi nhánh có một cái nút riêng.

## API cho nhánh

```js
window.App.registerBranch({
  id: 'ai-notes', label: '1 · AI Notes',
  railTitle: 'Tiêu đề panel bên phải',
  task: 'Việc người dùng cần làm',
  outcome: 'Kết quả kỳ vọng, đo được',
  mount(container, api, footer) { /* dựng UI của nhánh */ }
});
```

`api` cung cấp:

| | |
|---|---|
| `api.fixture` | toàn bộ dữ liệu buổi học |
| `api.state` | `{ slideIndex, timeSec, playing, marks }` |
| `api.goToSlide(i)` / `api.seek(sec)` | điều khiển bài giảng |
| `api.addMark({type, text, note})` / `api.removeMark(id)` / `api.getMarks()` | dấu vết dùng chung, tự đồng bộ lên timeline |
| `api.getSelectionText()` | chữ người dùng đang bôi đen |
| `api.on(evt, fn)` | `slide:change`, `time:change`, `marks:change`, `play:change`, `branch:change` |
| `api.UI` | `noteCard`, `emptyState`, `skeletonBlock`, `toast`, `icon`, `el`, `fmtTime` |

Vì `marks` nằm ở base nên ghi chú tạo ở hướng 1 hoặc 2 xuất hiện ngay trong hướng 3 —
chuỗi tạo ghi chú → quay lại ôn test được liền mạch.

## Phím tắt

`←` `→` chuyển slide · `.` phát/dừng · trên thanh tiến trình dùng `←` `→` để tua 30 giây.

## Đã bám các rule

Chạm ≥ 44×44px, contrast text ≥ 4.5:1, focus ring rõ, icon SVG (không emoji), transition
150–320ms, `prefers-reduced-motion` được tôn trọng, responsive 375/768/1024/1440.
