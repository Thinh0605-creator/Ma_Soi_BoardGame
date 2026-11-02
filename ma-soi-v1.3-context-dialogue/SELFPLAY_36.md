# Huấn luyện self-play 36 vai — v1.2 (bản thử nghiệm)

## Đã thực hiện
- Đọc danh sách **36 ID vai** từ `roles.js`, đưa tất cả vào chương trình huấn luyện theo phân bố vai thay đổi qua mỗi ván.
- Mô phỏng ván có đêm, ngày, thảo luận, bỏ phiếu và kết quả thắng/thua.
- Mô phỏng **theo nhóm kỹ năng**: soi, bảo vệ, hồi sinh/cứu, độc, trả thù, giết độc lập và nhiễm Sói. Một số hiệu ứng giả lập có xác suất và không tuân thủ hoàn toàn luật của vai.
- Lưu trọng số chọn chiến thuật 7 hành động, có thể dùng trong giao diện game offline.
- Đếm số lần mỗi vai xuất hiện trong `selfplay36-policy.json` (`roleCoverage`).

## Chưa thực hiện / KHÔNG được hiểu nhầm
- **Không phải** 36 vai đã được mô phỏng đúng toàn bộ kỹ năng và điều kiện thắng. Phe độc lập, Cupid/người yêu, các vai thao túng, nhiều hiệu ứng riêng và hệ thống đề cử–biện hộ chưa được mô phỏng chính xác.
- Bộ mô phỏng Python là engine riêng, không chạy trực tiếp engine JavaScript của game.
- Trọng số học hiện chỉ ảnh hưởng đến **chiến thuật phát biểu**, không tự sửa logic bỏ phiếu, kỹ năng đêm hay tạo ngôn ngữ tự nhiên.
- Không có bảo đảm tỷ lệ thắng, trí thông minh hay chất lượng đối thoại tăng lên. Cần đo bằng đối thủ cố định, nhiều seed và đánh giá con người.

## Chạy
- `train_selfplay.bat`: 10.000 ván / 12 người, cần Python 3.
- `python selfplay36.py --games 20000 --players 16 --seed 42`: cấu hình tùy chọn.
- Kết quả ghi vào `selfplay36-policy.json`, không ghi đè trọng số v1.1 đang chơi. Muốn thử trọng số mới, chạy `activate_36_policy.bat` (tự sao lưu), muốn hoàn nguyên chạy `restore_policy.bat`.
- Có thể chơi không cần Python và không cần Internet; Python chỉ dùng để huấn luyện lại.

## Cách đánh giá đúng
1. Chạy đánh giá cùng seed, cùng bộ vai, so sánh với chính sách gốc và chính sách đối thủ cố định.
2. Theo dõi tỷ lệ thắng từng phe, từng vai và độ dài ván; kiểm tra sự thiên lệch.
3. Thử các câu hỏi người chơi ngoài kịch bản để đánh giá khả năng hiểu ngôn ngữ riêng biệt.

## Kết quả thử nghiệm thực tế (10.000 ván, 12 người, seed 42)
- Đã lấy mẫu đủ 36/36 vai.
- Sói thắng 97,8% khi huấn luyện; đánh giá 500 ván: 99,2% chính sách gốc và 96,8% chính sách mới.
- **Mô phỏng bị lệch nặng về Sói**, vì vậy trọng số mới **không được bật mặc định**. Chưa đủ bằng chứng để kết luận thông minh hơn.
