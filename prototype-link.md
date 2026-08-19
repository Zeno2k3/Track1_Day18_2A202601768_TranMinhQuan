# Prototype links — A / B / C (chung nhóm)

Ba option chạy **trên một shell**, cùng fixture `ml-04`. Đổi nhánh ở góc phải trên, hoặc hash URL.

**Repo:** https://github.com/Zeno2k3/Track1_Day18_2A202601768_TranMinhQuan  
**Nhánh có đủ A+B+C đã gộp:** `feature/template` · [PR #2](https://github.com/Zeno2k3/Track1_Day18_2A202601768_TranMinhQuan/pull/2)

## Cách mở (test-ready)

```bash
git clone https://github.com/Zeno2k3/Track1_Day18_2A202601768_TranMinhQuan.git
cd Track1_Day18_2A202601768_TranMinhQuan
git checkout feature/template
cd base_component
python -m http.server 8018
```

Trình duyệt: `http://localhost:8018` rồi **Ctrl+F5**.

| Option | Hash | Việc tester làm (cùng task) |
|---|---|---|
| **A · AI Notes** | http://localhost:8018/#ai-notes | Bôi đen chữ **trên slide hoặc transcript** → Quan trọng / Chưa hiểu / Ghi chú → slide cuối → Tổng hợp → Đúng / Sửa / Bỏ → Lưu |
| **B · Template** | http://localhost:8018/#template | Chọn tab Ý chính / Chưa hiểu / Việc cần làm → gõ (thử chữ trên slide để hiện gợi ý) → Enter hoặc + Thêm → Xem tổng hợp |
| **C · Nhắc ôn** | http://localhost:8018/#reminder | Chọn lịch cố định hoặc AI → bật notification → nhận mốc → Mở ôn / Để sau → lật thẻ, tự đánh giá |

Mã nguồn panel: [`base_component/js/branches.js`](./base_component/js/branches.js) · shell: [`base_component/index.html`](./base_component/index.html)

## Slide / demo nhóm (cùng artifact)

* Design + kết quả test: [`slides_2.html`](./slides_2.html) (trong repo; video demo nếu có nằm `videodemo/`)
* Board nhóm: [Google Docs](https://docs.google.com/document/d/1DrYW34bF2Alx85sDRTRklhkQOZyJwq20dTLwp5t13ZQ/edit?tab=t.8hk9b0yl75jw)

Không cần tài khoản. Không cần facilitator đứng cạnh để “giải thích option” — banner trên panel ghi bước làm. Cả ba option cùng user, situation, task, content, outcome (xem Design Sheet).
