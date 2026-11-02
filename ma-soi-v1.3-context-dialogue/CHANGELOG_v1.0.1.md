# Ma Sói v1.0.1 — Chế độ đọc tranh luận

- Bố cục ba cột: Biên Niên Sử (trái), bàn chơi (giữa), chat (phải).
- Nhịp bot: Chậm 12 giây, Vừa 8 giây, Nhanh 4 giây. Có nút tạm dừng bot (không dừng đồng hồ ván chơi).
- Chỉ tự cuộn khi người đọc đang ở cuối. Khi đọc tin cũ, có nút báo tin mới để nhảy xuống.
- Lọc trùng lời thoại gần đây (chuẩn hóa và kiểm tra trùng ý bằng từ vựng).
- Không cần Gemini hoặc file .env. Huấn luyện offline vẫn là mô phỏng tình huống tổng hợp, không phải mô hình ngôn ngữ.
- Giới hạn: chống lặp theo từ vựng không phát hiện mọi câu đồng nghĩa; nhịp bot không dừng đồng hồ phiên tòa.
