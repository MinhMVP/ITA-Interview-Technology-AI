#  ITA Web - AI-Powered Career Prep & Mentoring Platform

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)

ITA Web là một nền tảng đột phá kết hợp **Trí tuệ nhân tạo (AI)** và **Hệ sinh thái Cố vấn (Mentoring)**, giúp các ứng viên ngành IT tối ưu hóa lộ trình sự nghiệp, nâng cấp CV đạt chuẩn ATS, luyện phỏng vấn thực tế và kết nối 1-1 với các chuyên gia trong ngành.

Web demo đã deploy : https://itaphongvan.vercel.app/ 

Thành viên tham gia gồm : Nguyễn Anh Minh, Nguyễn Duy, Trần Viết Duy Huy, Nguyễn Quang Minh, Nguyễn Quốc Tuấn
---

##  Các tính năng cốt lõi (Core Features)

### 1.  Phân tích & Chấm điểm CV bằng AI (AI CV Analysis)
- **Đọc file đa định dạng:** Trích xuất văn bản từ PDF (bằng `pdf.js-dist` kết hợp thuật toán tính khoảng cách) và Word DOCX (bằng `mammoth.js`).
- **Lọc CV rác:** Thuật toán tiền xử lý giúp phát hiện CV trống, CV đùa cợt trước khi gọi AI để tối ưu hóa tài nguyên.
- **AI Đóng vai Chuyên gia tuyển dụng:** Sử dụng sức mạnh của **Google Gemini 1.5 Flash** và **Groq Llama 3.3 70B** để chấm điểm ATS, phân tích dự án, kỹ năng và mức độ phù hợp với JD (Job Description).
- **Auto-Rotation API Keys:** Cơ chế tự động quay vòng (Round-robin) các API Keys và Fallback thông minh giúp hệ thống không bao giờ bị sập (lỗi 429 Rate Limit) khi có lượng truy cập lớn.

### 2.  Hệ sinh thái Cố vấn IT (Mentor Booking System)
- **Mentor Portal:** Không gian làm việc riêng biệt cho phép chuyên gia (Mentor) thiết lập lịch rảnh (Available time slots), quản lý các buổi hẹn, đăng bài viết chuyên môn (Tech Blog) và xem phản hồi (Reviews).
- **Mentee/User Portal:** Danh bạ tìm kiếm Mentor theo kỹ năng công nghệ. Cho phép học viên đặt lịch (Booking) với thao tác đơn giản, chống trùng lịch an toàn.
- **Nhắc nhở tự động:** Tích hợp nhắc lịch (Booking Reminder) giúp cả học viên và cố vấn không bỏ lỡ buổi Mentoring.
- **Bảo mật phân quyền:** Hệ thống Guard Routing (`MentorRoute`, `ProtectedRoute`) ngăn chặn truy cập trái phép vào Dashboard quản lý.

### 3.  Luyện Phỏng Vấn Mock Interview với AI
- **Nhận diện giọng nói (Speech-to-Text):** Tích hợp Whisper AI và thư viện nhận diện giọng nói cho phép ứng viên trả lời phỏng vấn trực tiếp bằng micro.
- **Phản hồi bằng giọng nói (Text-to-Speech):** AI phỏng vấn viên trả lời lại bằng âm thanh nhờ tích hợp đa dạng API TTS: Google Cloud TTS, ElevenLabs, Itera.
- **Đánh giá thời gian thực:** Đánh giá độ tự tin, tính chính xác về mặt kỹ thuật của câu trả lời.

---

##  Công nghệ sử dụng (Tech Stack)

###  Frontend & UI/UX
- **Core:** React 19, Vite
- **Routing:** React Router Dom v7
- **Animations & 3D:** Framer Motion, GSAP, Lenis (Smooth Scrolling), Three.js (@react-three/fiber, @react-three/drei) cho các hiệu ứng đồ họa 3D ấn tượng.
- **Utilities:** React Quill (Rich Text Editor), Lucide React (Icons), html2canvas, jspdf.

###  Backend & Cơ sở dữ liệu
- **BaaS:** Supabase
- **Database:** PostgreSQL (Lưu trữ lịch Mentor, CV ứng viên, đánh giá, v.v.)
- **Auth & Storage:** Supabase Authentication & Supabase Storage (Lưu trữ file CV, Avatar).
- **Triggers & Functions:** Supabase Edge Functions cho các luồng webhook tự động.

###  Trí Tuệ Nhân Tạo (AI / ML)
- `@google/genai` (Google Gemini SDK)
- Groq API (Llama 3.3)
- Các công cụ bóc tách: `pdfjs-dist` (PDF), `mammoth` (DOCX).

---

## 📂 Cấu trúc thư mục (Folder Structure)

```text
📦 project-rbl-team-2
 ┣ 📂 src
 ┃ ┣ 📂 assets       # Hình ảnh, font, tài nguyên tĩnh
 ┃ ┣ 📂 components   # Các components tái sử dụng (BookingReminder, Layouts, UI...)
 ┃ ┣ 📂 constants    # Dữ liệu tĩnh, cấu hình hằng số (Job Positions...)
 ┃ ┣ 📂 hooks        # Custom React Hooks
 ┃ ┣ 📂 pages        # Chứa giao diện theo nghiệp vụ:
 ┃ ┃ ┣ 📂 CV         # Giao diện tải lên & phân tích CV
 ┃ ┃ ┣ 📂 Mentor     # Mentor Dashboard, Schedule, Session, Blog...
 ┃ ┃ ┣ 📂 User       # Nơi Mentee tìm kiếm và đặt lịch Cố vấn
 ┃ ┃ ┗ 📂 Interview  # Giao diện luyện phỏng vấn AI
 ┃ ┣ 📂 routes       # Cấu hình React Router, Protected/Mentor Routes
 ┃ ┗ 📂 utils        # Chứa Logic cốt lõi & API Services:
 ┃   ┣ 📜 aiKeyManager.js        # Quản lý & quay vòng AI API Key
 ┃   ┣ 📜 cvAnalysisService.js   # Bộ não bóc tách & chạy AI chấm CV
 ┃   ┗ 📜 *TtsService.js         # Các module Text-to-Speech (Google, ElevenLabs...)
 ┣ 📂 supabase       # File cấu hình & schema của Database (SQL migrations)
 ┗ 📜 package.json   # Dependencies dự án
```

---

##  Hướng dẫn Cài đặt & Chạy dự án (Getting Started)

**1. Clone dự án về máy**
```bash
git clone <your-github-repo-url>
cd project-rbl-team-2
```

**2. Cài đặt các gói phụ thuộc**
```bash
npm install
```

**3. Thiết lập biến môi trường (.env)**
Tạo file `.env` ở thư mục gốc và cung cấp các khóa API cần thiết:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Keys (Có thể thêm nhiều key từ 1 đến 5 để kích hoạt Auto-Rotation)
VITE_GEMINI_API_KEY_1=your_gemini_key_1
VITE_GROQ_API_KEY_1=your_groq_key_1
# TTS & Speech
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
```

*Dự án được xây dựng với mục tiêu giúp sinh viên và ứng viên IT vượt qua nỗi sợ phỏng vấn, sở hữu CV ấn tượng và nhận được sự hướng dẫn tận tình từ các chuyên gia thực chiến.* 🎓💼
