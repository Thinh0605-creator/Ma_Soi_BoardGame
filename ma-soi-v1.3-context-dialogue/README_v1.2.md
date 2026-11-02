# Ma Sói v1.2 — 36-role curriculum self-play

- Giữ game offline, giao diện 3 cột, nhịp thoại 12 giây từ v1.1.
- Mặc định giữ trọng số v1.1 ổn định từ `selfplay-policy.json`. Trọng số mới nằm ở `selfplay36-policy.json`, chưa tự bật do kết quả đánh giá còn lệch.
- Chạy `train_selfplay.bat` để huấn luyện lại trên bộ mô phỏng rút gọn có lấy mẫu 36 vai. Dùng `activate_36_policy.bat` nếu muốn thử, `restore_policy.bat` để khôi phục.
- Xem `SELFPLAY_36.md` để hiểu chính xác giới hạn.
- **Chưa phải bản 36 vai mô phỏng đúng 100%**, và chưa huấn luyện mô hình ngôn ngữ.
