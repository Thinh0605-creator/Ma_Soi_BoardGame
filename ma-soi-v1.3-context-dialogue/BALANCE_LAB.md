# Phòng thử nghiệm cân bằng v1.2.1

## Những gì đã sửa
- Mô phỏng đề cử theo ngưỡng 20% số người sống, biện hộ trừu tượng, biểu quyết Có/Không theo từng ứng viên với ngưỡng 2/3 tổng số người sống; tối đa một người bị xử tử mỗi ngày.
- Bot điều tra có thể công khai lời khai; người khác cập nhật nghi ngờ theo độ tin cậy thay vì giữ thông tin mãi trong đầu.
- Báo cáo riêng kết quả chính sách gốc và chính sách huấn luyện, sử dụng cùng hạt giống đánh giá.

## Chưa hoàn chỉnh
- **Không** mô phỏng chính xác 36 vai. Chỉ lấy mẫu đủ 36 mã vai và dùng các nhóm kỹ năng xấp xỉ.
- **Không** mô phỏng điều kiện thắng của phe Độc Lập, tình nhân, kỹ năng độc đáo, thời gian biện hộ, mọi chi tiết luật. Do đó không được suy ra tỷ lệ thắng 3 phe từ báo cáo.
- Chính sách mới **không được tự động kích hoạt** trong game. Bộ mô phỏng không phải game engine trình duyệt; file policy hiện chỉ tác động đến chiến thuật phát biểu.
- Cần mô phỏng đồng nhất với engine.js, đánh giá theo từng cấu hình bài và số người, và kiểm thử với người thật trước khi gọi là cân bằng.

## Chạy thử
`python selfplay36.py --games 2000 --players 8 --seed 42`

Dùng `restore_policy.bat` nếu đã kích hoạt thử chính sách v1.2.
