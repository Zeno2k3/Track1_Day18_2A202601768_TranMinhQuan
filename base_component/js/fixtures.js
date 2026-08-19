/* ============================================================
   FIXTURE — dữ liệu buổi học dùng chung cho CẢ 3 NHÁNH.
   Nguyên tắc: 3 prototype phải chạy trên đúng bộ dữ liệu này
   thì mới so sánh được kết quả với nhau. Không nhánh nào
   được sửa file này — muốn thêm dữ liệu thì thêm vào đây và
   cả 3 nhánh cùng nhận.
   ============================================================ */
window.FIXTURE = {
  course: "Nhập môn Machine Learning",
  lesson: {
    id: "ml-04",
    index: 4,
    title: "Buổi 4 — Overfitting & Regularization",
    instructor: "TS. Lê Hoàng Nam",
    durationSec: 2700,          // 45 phút
    date: "2026-08-18"
  },

  learner: {
    name: "Trần Minh Quân",
    level: "Người mới học, nền tảng toán trung bình",
    goal: "Hiểu để làm được bài tập cuối tuần và ôn lại trước kỳ kiểm tra"
  },

  /* --- Task & Desired outcome: CHUNG cho cả 3 nhánh ---
     Đây là việc của HỌC VIÊN, không phải việc của công cụ, nên cả 3 prototype
     phải nhận đúng một task và một outcome thì mới so sánh được với nhau.
     Khác nhau giữa 3 nhánh nằm ở CÁCH giải, không nằm ở đề bài. --- */
  job: {
    task: "Sau buổi ML 45 phút, có bản ghi chú tin được để làm bài tập cuối tuần và ôn trước kỳ kiểm tra — không phải xem lại cả buổi",
    outcome: "≤ 3 phút sau bài đã có bản ghi chú học viên thấy đúng ≥ 80% ý; đến lúc cần ôn thì mở ra dùng lại được trong dưới 3 phút"
  },

  /* --- 8 slide, đủ để test cuộn / chuyển / neo ghi chú theo slide --- */
  slides: [
    {
      id: "s1", startSec: 0,
      eyebrow: "Mở đầu",
      title: "Vì sao mô hình học thuộc bài lại là chuyện xấu?",
      lead: "Một mô hình đạt 99% trên tập huấn luyện nhưng 62% trên dữ liệu thật — đó không phải mô hình giỏi, đó là mô hình học vẹt.",
      bullets: [
        "Mục tiêu của học máy là <b>tổng quát hoá</b>, không phải ghi nhớ.",
        "Sai số quan sát được = sai số do <b>bias</b> + sai số do <b>variance</b> + nhiễu không thể khử.",
        "Buổi hôm nay trả lời: làm sao nhận ra, đo được, và ghìm được overfitting."
      ]
    },
    {
      id: "s2", startSec: 300,
      eyebrow: "Khái niệm",
      title: "Overfitting và Underfitting",
      lead: "Hai đầu của cùng một cây thước. Mọi quyết định về độ phức tạp mô hình đều là chọn một điểm trên cây thước đó.",
      bullets: [
        "<b>Underfitting</b>: mô hình quá đơn giản, sai cả trên tập train lẫn tập test.",
        "<b>Overfitting</b>: mô hình bám cả nhiễu của tập train, train tốt — test tệ.",
        "Dấu hiệu nhận biết nhanh: khoảng cách giữa <i>train error</i> và <i>validation error</i> nới rộng dần."
      ],
      figure:
        "  error\n    ^\n    |  \\                    /  validation\n    |   \\                 /\n    |    \\_____________/\n    |         \\\n    |          \\_________  train\n    +-------------------------> model complexity\n           ^ điểm ngọt (sweet spot)"
    },
    {
      id: "s3", startSec: 640,
      eyebrow: "Trực giác",
      title: "Đánh đổi Bias – Variance",
      lead: "Giảm cái này thường làm tăng cái kia. Kỹ năng thật sự là biết mình đang đứng ở phía nào.",
      bullets: [
        "<b>Bias cao</b>: giả định quá cứng → bỏ sót quy luật thật.",
        "<b>Variance cao</b>: mô hình đổi rất nhiều khi đổi tập dữ liệu → không ổn định.",
        "Thêm dữ liệu giúp giảm variance, <b>không</b> giúp giảm bias.",
        "Đây là chỗ hay bị hỏi trong kiểm tra: cho một biểu đồ, chỉ ra đang bias cao hay variance cao."
      ]
    },
    {
      id: "s4", startSec: 1020,
      eyebrow: "Kỹ thuật 1",
      title: "Regularization L1 và L2",
      lead: "Thêm một khoản 'phạt' vào hàm mất mát để mô hình không được phép quá tự do.",
      bullets: [
        "<b>L2 (Ridge)</b>: phạt tổng bình phương trọng số → kéo mọi trọng số về gần 0, hiếm khi bằng 0.",
        "<b>L1 (Lasso)</b>: phạt tổng trị tuyệt đối → đẩy hẳn một số trọng số về 0, tự chọn đặc trưng.",
        "Hệ số <b>λ</b> quyết định phạt mạnh hay nhẹ. λ quá lớn → quay lại underfitting."
      ],
      figure:
        "L2:  J(w) = MSE(w) + λ · Σ wᵢ²\nL1:  J(w) = MSE(w) + λ · Σ |wᵢ|\n\nλ = 0     → không phạt, dễ overfit\nλ → ∞     → mọi w → 0, underfit"
    },
    {
      id: "s5", startSec: 1420,
      eyebrow: "Kỹ thuật 2",
      title: "Cross-validation: đo cho đúng trước khi chỉnh",
      lead: "Không có phép đo tin cậy thì mọi việc chỉnh mô hình chỉ là đoán.",
      bullets: [
        "Chia dữ liệu thành k phần, luân phiên lấy 1 phần làm validation — thường k = 5 hoặc 10.",
        "Điểm số cuối là trung bình của k lần → ít phụ thuộc vào một lần chia may rủi.",
        "<b>Cạm bẫy</b>: chuẩn hoá dữ liệu trước khi chia sẽ làm rò rỉ thông tin từ tập test."
      ]
    },
    {
      id: "s6", startSec: 1800,
      eyebrow: "Kỹ thuật 3",
      title: "Early stopping, Dropout và tăng cường dữ liệu",
      lead: "Ba công cụ hay dùng nhất khi làm việc với mạng nơ-ron.",
      bullets: [
        "<b>Early stopping</b>: dừng huấn luyện khi validation loss bắt đầu tăng trở lại.",
        "<b>Dropout</b>: ngẫu nhiên tắt một tỉ lệ nơ-ron mỗi bước → mô hình không ỷ lại vào một đường duy nhất.",
        "<b>Data augmentation</b>: xoay, lật, cắt ảnh để tăng lượng dữ liệu hiệu dụng."
      ]
    },
    {
      id: "s7", startSec: 2180,
      eyebrow: "Thực hành",
      title: "Quy trình chẩn đoán 4 bước",
      lead: "Khi mô hình chạy không như ý, làm theo thứ tự này thay vì chỉnh bừa.",
      bullets: [
        "1. Vẽ learning curve của train và validation theo số lượng mẫu.",
        "2. Hai đường sát nhau và đều cao → bias cao → tăng độ phức tạp mô hình.",
        "3. Khoảng cách rộng, train rất thấp → variance cao → thêm dữ liệu hoặc tăng regularization.",
        "4. Chỉ chỉnh <b>một</b> thứ mỗi lần, ghi lại kết quả trước khi chỉnh tiếp."
      ]
    },
    {
      id: "s8", startSec: 2500,
      eyebrow: "Tổng kết",
      title: "Ba điều cần nhớ và bài tập về nhà",
      lead: "Nếu chỉ nhớ được ba câu từ buổi hôm nay, hãy nhớ ba câu này.",
      bullets: [
        "Overfitting là bám nhiễu; đo bằng khoảng cách train–validation.",
        "L1 chọn đặc trưng, L2 làm mượt; λ là nút vặn giữa hai thái cực.",
        "Đo trước, chỉnh sau, mỗi lần một thứ.",
        "<b>Bài tập</b>: chạy Ridge với λ ∈ {0.01, 0.1, 1, 10}, vẽ validation curve, nộp trước Chủ nhật."
      ]
    }
  ],

  /* --- Transcript có timestamp, khớp với slide qua startSec --- */
  transcript: [
    { t: 12,   slideId: "s1", text: "Trước khi vào bài, thầy hỏi lại buổi trước: mô hình 99% trên tập train thì có tốt không? Câu trả lời gần như luôn là chưa chắc." },
    { t: 96,   slideId: "s1", text: "Cái chúng ta thật sự cần là khả năng tổng quát hoá — chạy đúng trên dữ liệu chưa từng thấy." },
    { t: 210,  slideId: "s1", text: "Sai số chia làm ba phần: bias, variance, và nhiễu. Phần nhiễu thì chịu, hai phần còn lại mình can thiệp được." },
    { t: 312,  slideId: "s2", text: "Underfitting là khi mô hình quá đơn giản. Sai ở cả train lẫn test, và đây là ca dễ nhận ra nhất." },
    { t: 430,  slideId: "s2", text: "Overfitting khó nhận hơn vì trên tập train nhìn rất đẹp. Phải nhìn vào validation mới thấy vấn đề." },
    { t: 560,  slideId: "s2", text: "Nhìn biểu đồ này: đường validation đi xuống rồi bật lên. Chỗ nó bật lên chính là ranh giới bắt đầu overfit." },
    { t: 655,  slideId: "s3", text: "Bias cao nghĩa là mình áp đặt giả định quá cứng lên dữ liệu, ví dụ ép một quan hệ cong thành đường thẳng." },
    { t: 780,  slideId: "s3", text: "Variance cao là khi đổi tập dữ liệu một chút mà mô hình đổi hoàn toàn. Nó học cả những thứ không nên học." },
    { t: 900,  slideId: "s3", text: "Một điểm rất hay bị nhầm: thêm dữ liệu chữa được variance, nhưng không chữa được bias. Nhớ giúp thầy chỗ này." },
    { t: 1035, slideId: "s4", text: "Regularization về bản chất là mình thêm một khoản phạt vào hàm mất mát, để mô hình không được tự do muốn làm gì thì làm." },
    { t: 1150, slideId: "s4", text: "L2 phạt bình phương trọng số nên nó kéo tất cả về gần 0 nhưng hiếm khi đúng bằng 0." },
    { t: 1265, slideId: "s4", text: "L1 thì khác, nó đẩy hẳn một số trọng số về 0. Nên người ta hay dùng L1 khi muốn mô hình tự chọn đặc trưng." },
    { t: 1360, slideId: "s4", text: "Lambda là nút vặn. Vặn quá tay thì mọi trọng số về 0 và mình quay lại underfitting." },
    { t: 1440, slideId: "s5", text: "Trước khi chỉnh bất cứ thứ gì, phải có phép đo tin được. Cross-validation sinh ra để làm việc đó." },
    { t: 1580, slideId: "s5", text: "Chia k phần, luân phiên giữ lại một phần làm validation, chạy k lần rồi lấy trung bình." },
    { t: 1700, slideId: "s5", text: "Cạm bẫy kinh điển: chuẩn hoá toàn bộ dữ liệu trước khi chia. Làm vậy là rò rỉ thông tin từ tập test sang, điểm số sẽ đẹp giả." },
    { t: 1820, slideId: "s6", text: "Early stopping đơn giản là theo dõi validation loss, thấy nó bắt đầu đi lên thì dừng." },
    { t: 1950, slideId: "s6", text: "Dropout thì mỗi bước huấn luyện tắt ngẫu nhiên một số nơ-ron, buộc mạng không được ỷ lại vào một con đường duy nhất." },
    { t: 2080, slideId: "s6", text: "Với ảnh, tăng cường dữ liệu bằng xoay lật cắt là cách rẻ nhất để có thêm dữ liệu hiệu dụng." },
    { t: 2200, slideId: "s7", text: "Khi mô hình chạy không như ý, đừng chỉnh bừa. Vẽ learning curve trước đã." },
    { t: 2320, slideId: "s7", text: "Hai đường sát nhau mà đều cao thì đó là bias. Khoảng cách rộng, train rất thấp thì đó là variance." },
    { t: 2420, slideId: "s7", text: "Và quan trọng nhất: mỗi lần chỉ chỉnh một thứ, ghi lại kết quả. Chỉnh ba thứ cùng lúc thì không biết cái nào có tác dụng." },
    { t: 2520, slideId: "s8", text: "Tóm lại ba ý: overfitting là bám nhiễu, L1 chọn đặc trưng còn L2 làm mượt, và đo trước chỉnh sau." },
    { t: 2630, slideId: "s8", text: "Bài tập: chạy Ridge với bốn giá trị lambda, vẽ validation curve, nộp trước Chủ nhật. Buổi sau mình chữa." }
  ],

  /* --- Dấu vết ghi nhớ có sẵn: mô phỏng học viên đã học được 1 đoạn --- */
  seedMarks: [
    { id: "m1", type: "highlight", slideId: "s2", t: 560,  text: "Dấu hiệu nhận biết nhanh: khoảng cách giữa train error và validation error nới rộng dần.", note: "" },
    { id: "m2", type: "question",  slideId: "s3", t: 900,  text: "Thêm dữ liệu giúp giảm variance, không giúp giảm bias.", note: "Vì sao thêm dữ liệu lại không giảm được bias? Chưa hiểu chỗ này." },
    { id: "m3", type: "note",      slideId: "s4", t: 1265, text: "L1 đẩy hẳn một số trọng số về 0.", note: "Lasso = chọn đặc trưng. Ridge = làm mượt. Nhớ theo cặp này." },
    { id: "m4", type: "question",  slideId: "s5", t: 1700, text: "Chuẩn hoá dữ liệu trước khi chia sẽ làm rò rỉ thông tin.", note: "Vậy thứ tự đúng là chia trước rồi fit scaler trên train? Hỏi lại thầy." },
    { id: "m5", type: "highlight", slideId: "s7", t: 2420, text: "Mỗi lần chỉ chỉnh một thứ, ghi lại kết quả trước khi chỉnh tiếp.", note: "" }
  ],

  /* --- Kết quả kỳ vọng: bản ghi chú "chuẩn" để 3 nhánh đối chiếu ---
     Mỗi ý mang theo DẪN CHỨNG (sources: đoạn gốc + mốc thời gian) và cờ
     `inferred` = AI tự suy luận thêm, không có câu nào trong bài nói thẳng.
     Nhánh 1 dùng hai trường này để hiện evidence & uncertainty. --- */
  goldenSummary: {
    keyPoints: [
      {
        text: "Overfitting = mô hình bám cả nhiễu của tập train; nhận biết qua khoảng cách train–validation nới rộng.",
        sources: [
          { t: 430, slideId: "s2", quote: "Overfitting khó nhận hơn vì trên tập train nhìn rất đẹp. Phải nhìn vào validation mới thấy vấn đề." },
          { t: 560, slideId: "s2", quote: "Đường validation đi xuống rồi bật lên. Chỗ nó bật lên chính là ranh giới bắt đầu overfit." }
        ]
      },
      {
        text: "Bias cao và variance cao cần hai cách chữa khác nhau; thêm dữ liệu chỉ chữa được variance.",
        inferred: true,
        sources: [
          { t: 655, slideId: "s3", quote: "Bias cao nghĩa là mình áp đặt giả định quá cứng lên dữ liệu." },
          { t: 900, slideId: "s3", quote: "Thêm dữ liệu chữa được variance, nhưng không chữa được bias." }
        ]
      },
      {
        text: "L2 (Ridge) làm mượt trọng số, L1 (Lasso) đẩy trọng số về 0 và tự chọn đặc trưng; λ là nút vặn.",
        sources: [
          { t: 1150, slideId: "s4", quote: "L2 phạt bình phương trọng số nên nó kéo tất cả về gần 0 nhưng hiếm khi đúng bằng 0." },
          { t: 1265, slideId: "s4", quote: "L1 đẩy hẳn một số trọng số về 0. Nên hay dùng L1 khi muốn mô hình tự chọn đặc trưng." },
          { t: 1360, slideId: "s4", quote: "Lambda là nút vặn. Vặn quá tay thì mọi trọng số về 0 và mình quay lại underfitting." }
        ]
      },
      {
        text: "Cross-validation k-fold cho phép đo tin cậy; không chuẩn hoá trước khi chia dữ liệu.",
        sources: [
          { t: 1580, slideId: "s5", quote: "Chia k phần, luân phiên giữ lại một phần làm validation, chạy k lần rồi lấy trung bình." },
          { t: 1700, slideId: "s5", quote: "Cạm bẫy kinh điển: chuẩn hoá toàn bộ dữ liệu trước khi chia. Làm vậy là rò rỉ thông tin từ tập test sang." }
        ]
      },
      {
        text: "Quy trình chẩn đoán: vẽ learning curve → xác định bias hay variance → chỉnh một thứ mỗi lần.",
        inferred: true,
        sources: [
          { t: 2200, slideId: "s7", quote: "Khi mô hình chạy không như ý, đừng chỉnh bừa. Vẽ learning curve trước đã." },
          { t: 2320, slideId: "s7", quote: "Hai đường sát nhau mà đều cao thì đó là bias. Khoảng cách rộng, train rất thấp thì đó là variance." },
          { t: 2420, slideId: "s7", quote: "Mỗi lần chỉ chỉnh một thứ, ghi lại kết quả." }
        ]
      }
    ],
    openQuestions: [
      {
        text: "Vì sao thêm dữ liệu không giảm được bias?",
        sources: [
          { t: 900, slideId: "s3", quote: "Thêm dữ liệu chữa được variance, nhưng không chữa được bias. Nhớ giúp thầy chỗ này." }
        ]
      },
      {
        text: "Thứ tự đúng khi chuẩn hoá dữ liệu trong pipeline cross-validation là gì?",
        inferred: true,
        sources: [
          { t: 1700, slideId: "s5", quote: "Chuẩn hoá toàn bộ dữ liệu trước khi chia là rò rỉ thông tin từ tập test sang." }
        ]
      }
    ],
    actionItems: [
      {
        text: "Chạy Ridge với λ ∈ {0.01, 0.1, 1, 10}, vẽ validation curve, nộp trước Chủ nhật.",
        sources: [
          { t: 2630, slideId: "s8", quote: "Bài tập: chạy Ridge với bốn giá trị lambda, vẽ validation curve, nộp trước Chủ nhật." }
        ]
      }
    ]
  },

  /* Gợi ý từ khoá — dùng cho autocomplete ô nhập mẫu ghi chú */
  suggestions: [
    "Overfitting là bám nhiễu",
    "Underfitting",
    "Regularization L1/L2",
    "Cross-validation",
    "Bias cao",
    "Variance cao",
    "Early stopping",
    "Dropout",
    "Data augmentation",
    "Learning curve",
    "Ridge (L2) làm mượt trọng số",
    "Lasso (L1) chọn đặc trưng",
    "λ (lambda) là nút vặn",
    "Train error vs validation error",
    "k-fold (k = 5 hoặc 10)",
    "Không chuẩn hoá trước khi chia",
    "Tổng quát hoá",
    "Chỉnh một thứ mỗi lần"
  ],

  /* Gói dữ liệu mẫu cho tester — bấm ⚡ để nạp, không đụng seedMarks */
  samplePack: [
    {
      id: "sample-key",
      type: "highlight",
      slideId: "s2",
      t: 430,
      text: "Overfitting: mô hình bám cả nhiễu của tập train — train tốt, test tệ.",
      note: "Ý chính: nhận biết qua khoảng cách train–validation nới rộng."
    },
    {
      id: "sample-ask",
      type: "question",
      slideId: "s3",
      t: 900,
      text: "Thêm dữ liệu giúp giảm variance, không giúp giảm bias.",
      note: "Chưa hiểu: vì sao thêm dữ liệu không giảm được bias?"
    },
    {
      id: "sample-todo",
      type: "note",
      slideId: "s8",
      t: 2630,
      text: "Chạy Ridge với λ ∈ {0.01, 0.1, 1, 10}, vẽ validation curve, nộp trước Chủ nhật.",
      note: "Việc cần làm: nộp bài tập Ridge trước Chủ nhật."
    }
  ]
};
