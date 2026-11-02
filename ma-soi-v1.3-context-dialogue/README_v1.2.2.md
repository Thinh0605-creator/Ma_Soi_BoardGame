# Ma Sói v1.2.2 — Voting Lab

## Chơi
Giải nén, chạy `start_game.bat`, chọn luật biểu quyết trước khi bắt đầu ván:
- **2/3** (mặc định, luật cũ)
- **Quá bán** (>50% toàn bộ người còn sống)

Cả hai đều tính người bị đề cử trong tổng người sống; phiếu trắng không tính là phiếu CÓ. Ngưỡng đề cử 20% giữ nguyên. Tốc độ lời thoại mặc định 12 giây, giao diện ba cột giữ nguyên.

## Kiểm chứng
Chạy `compare_voting.bat` để so sánh hai luật trên cùng bộ seed. Đây là mô phỏng xấp xỉ, **không** phải engine 36 vai chính xác và **không** có điều kiện thắng phe độc lập chuẩn. Không tự động kích hoạt chính sách mới. `train_selfplay.bat` vẫn mặc định 2/3; để thử huấn luyện theo quá bán dùng `python selfplay36.py --games 10000 --players 8 --vote-rule majority` (sẽ ghi đè selfplay36-policy.json, nên sao lưu trước).

## Giới hạn
Bot bỏ phiếu hiện dựa trên mức nghi ngờ và có yếu tố ngẫu nhiên; chưa có hệ thống chứng cứ/đối chất và chiến thuật 36 vai được huấn luyện đầu-cuối. Chưa kiểm thử toàn bộ ván trong trình duyệt.
