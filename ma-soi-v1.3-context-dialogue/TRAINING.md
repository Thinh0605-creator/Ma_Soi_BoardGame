# Ma Sói v1.0 — Huấn luyện bot offline

## Hai kiểu học

**Trong ván:** `SocialMind` theo dõi lời nói, quan hệ tin tưởng và bất đồng. `BotAI` theo dõi nghi ngờ. Khi bắt đầu ván mới, trí nhớ sự kiện được làm mới.

**Qua nhiều ván:** `OfflineBrain.train()` chạy một **bài mô phỏng quyết định chiến thuật** gồm các tình huống ngẫu nhiên: bị buộc tội, mức bằng chứng, sức ép, liên minh và phe. Bot chọn một trong bảy chiến thuật (hỏi, phản bác, ủng hộ, thăm dò, xét lại, biện hộ, đánh lạc hướng). Điểm thưởng được tính bằng công thức giả lập theo bối cảnh, có nhiễu ngẫu nhiên; trọng số của chiến thuật được cập nhật từng lượt và lưu vào `localStorage` của trình duyệt.

**Rất quan trọng:** đây là *contextual bandit trên tình huống tổng hợp*, không phải hàng nghìn ván Ma Sói đầy đủ, không phải fine-tune mô hình ngôn ngữ, không có tỷ lệ thắng thực tế. Điểm thưởng là proxy thiết kế thủ công. Cải thiện điểm proxy **không chứng minh** bot chơi giỏi hơn con người. Để huấn luyện bằng self-play đầy đủ cần bộ mô phỏng luật, đo thắng/thua và đánh giá độc lập.

## Cách dùng

1. Mở game bằng `start_game.bat`, không cần `.env`, không cần Gemini.
2. Ở màn hình thiết lập, tìm **Huấn luyện chiến thuật bot — Offline**.
3. Chọn 1.000 / 5.000 / 20.000 lượt rồi bấm **Huấn luyện ngay**.
4. Bắt đầu ván: bot sẽ dùng trọng số đã lưu, kết hợp tình huống và trí nhớ hiện tại để chọn cách nói.
5. Bấm **Xóa kinh nghiệm** để quay lại cấu hình mặc định.

## Giới hạn

- Lời thoại được sinh từ nhiều cấu trúc câu theo chiến thuật, **không** đạt sự linh hoạt của Gemini. Các câu vẫn có thể lặp.
- Các chiến thuật bỏ phiếu/đêm trong `bot-ai.js` vẫn theo luật cũ, chưa được self-play tối ưu.
- Trọng số lưu trong trình duyệt hiện tại; đổi trình duyệt hoặc xóa dữ liệu trang sẽ mất.
- Không gửi dữ liệu ra mạng. Trình duyệt vẫn cần máy chủ HTTP cục bộ để tải module.
