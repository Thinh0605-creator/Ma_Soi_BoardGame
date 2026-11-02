# Ma Sói v1.1 — Self-play thực tế (bản thử nghiệm)

## Cách chạy
1. Đóng game, chạy `train_selfplay.bat` (cần Python 3). Mặc định huấn luyện 5.000 ván 8 người.
2. Chương trình mô phỏng các vòng Đêm -> Ngày -> thảo luận -> bỏ phiếu -> kiểm tra thắng thua, cho đến khi có phe thắng hoặc hết 20 ngày.
3. Kết quả lưu vào `selfplay-policy.json`. Mở game bằng `start_game.bat` và Ctrl+F5. Game tự nạp trọng số chiến thuật cho lời thoại.
4. Muốn thử 10.000 ván: `python selfplay.py --games 10000 --players 8`.

## Những gì thực sự được huấn luyện
- Các tác tử ra quyết định dựa trên quan sát cá nhân: điểm nghi ngờ, áp lực, bằng chứng, liên minh, bị tố cáo, phe của chính mình.
- Các hành động: hỏi, chất vấn, ủng hộ, thăm dò, xét lại, biện hộ, đánh lạc hướng (chỉ Sói).
- Sau ván, phe thắng được +1, phe thua -1. Cập nhật trọng số của hành động đã chọn bằng chênh lệch phần thưởng so với đường cơ sở (kiểu policy-gradient đơn giản).
- Mô phỏng có Tiên Tri, Bảo Vệ, Phù Thủy, Thợ Săn, Sói, Dân thường. Tiên Tri biết kết quả soi riêng; Sói biết đồng đội; các bot dân không được đọc vai thật khi chọn phát biểu.
- Trong game trình duyệt, trọng số self-play ảnh hưởng đến **chọn chiến thuật lời thoại** qua `OfflineBrain.choose()`; **chưa** tối ưu hành động đêm, bỏ phiếu, sinh câu văn hay 36 vai.

## Giới hạn cần hiểu rõ
- Bộ mô phỏng là một engine huấn luyện riêng, rút gọn; KHÔNG phải chạy toàn bộ engine 36 vai trong trình duyệt. Một số luật như đề cử/biện hộ được giản lược thành thảo luận và bỏ phiếu 2/3.
- Kết quả tỷ lệ thắng Sói không phải thước đo chất lượng tuyệt đối: nó phụ thuộc phân bố vai, luật mô phỏng, chiến lược của các bot đối thủ. Kết quả tự chơi có thể thiên lệch mạnh về phe Sói.
- Học từ thắng/thua không trực tiếp cải thiện hiểu tiếng Việt hoặc khả năng đáp lại câu hỏi lạ. Cần nâng cấp bộ phân tích câu hỏi và bộ sinh lời thoại để khắc phục tình trạng trả lời ngô nghê.
- Trọng số self-play được lưu vào file JSON (khác với bài huấn luyện tình huống cũ dùng localStorage). Chạy lại sẽ thay thế file này.
- Báo cáo đánh giá so sánh cùng điều kiện nhưng hai tập bot đều dùng cùng chính sách, không phải đánh giá head-to-head. Có thể giảm chất lượng; không cam kết tiến bộ.
