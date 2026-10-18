# 🗓️ Lenkeo Frontend - Ứng Dụng Hẹn Lịch Cùng Nhóm

Ứng dụng web hiện đại hỗ trợ đội nhóm, bạn bè dễ dàng tìm kiếm khung giờ rảnh chung, trực quan hóa lịch trình và trò chuyện trực tiếp để chốt lịch hẹn ("lên kèo") nhanh chóng nhất.

Frontend được xây dựng bằng **React 19**, **Vite**, **Tailwind CSS v4** và tích hợp hoàn chỉnh với hệ sinh thái **Serverless của AWS** (AWS Cognito, AWS AppSync GraphQL).

---

## 📑 Mục lục

- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Công nghệ sử dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
- [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
- [Yêu cầu môi trường](#-yêu-cầu-môi-trường)
- [Cài đặt và Khởi chạy](#-cài-đặt-và-khởi-chạy)
- [Cấu hình AWS (Cognito & AppSync)](#-cấu-hình-aws-cognito--appsync)
- [Các lệnh có sẵn (Scripts)](#-các-lệnh-có-sẵn-scripts)
- [Thiết kế & Tối ưu giao diện](#-thiết-kế--tối-ưu-giao-diện)

---

## ✨ Tính năng nổi bật

### 1. 🔐 Xác thực & Quản lý tài khoản (AWS Cognito)
- **Đăng ký & Đăng nhập**: Hỗ trợ đăng ký với đầy đủ Họ tên, Email, Mật khẩu và xác thực mã OTP qua Email.
- **Bảo mật phiên làm việc**: Quản lý phiên bằng AWS Amplify Authenticator, tự động đính kèm JWT Bearer Token trong các GraphQL request.
- **Quản lý tài khoản**: Hỗ trợ đăng xuất và tùy chọn xóa tài khoản người dùng trực tiếp.

### 2. 👥 Quản lý Nhóm hẹn (Group Management)
- **Tạo nhóm mới**: Khởi tạo nhóm nhanh chóng với tên nhóm tùy chọn, tự động sinh mã `Group ID`.
- **Tham gia nhóm**: Thành viên gia nhập nhóm dễ dàng thông qua mã `Group ID` với tính năng sao chép 1-click.
- **Phân quyền rõ ràng**:
  - **Trưởng nhóm (Owner)**: Có quyền xóa/giải tán nhóm.
  - **Thành viên**: Có quyền tự rời nhóm bất kỳ lúc nào.
- Xem danh sách thành viên trong nhóm kèm trạng thái đã đăng ký lịch hay chưa.

### 3. 📅 Lên lịch & Tìm khung giờ chung (Schedule & Overlap)
- **Đăng ký lịch rảnh (Availability)**: Thành viên dễ dàng thêm nhiều khoảng thời gian rảnh theo ngày & giờ.
- **Biểu đồ ma trận trực quan (Schedule Overlap Matrix)**: Hiển thị các khoảng thời gian rảnh của từng thành viên theo từng ngày.
- **Tính toán giờ trùng khớp (Auto-calculate Overlap)**:
  - Tự động tính toán điểm giao nhau giữa tất cả thành viên (hỗ trợ cả thuật toán client-side và truy vấn backend).
  - Nổi bật các khung giờ chung hoàn hảo với giao diện trực quan và nhãn gợi ý.
  - Tích hợp nút sao chép khung giờ hoặc gửi nhanh khung giờ vào ô chat để mọi người cùng thảo luận.

### 4. 💬 Trò chuyện thời gian thực (Real-time Group Chat)
- Hộp thoại trò chuyện trực tiếp (Live Chat) tích hợp ngay bên cạnh bảng lịch.
- Đồng bộ tin nhắn tức thì bằng **GraphQL Subscriptions** (AWS AppSync qua WebSockets).
- Giao diện bong bóng chat hiện đại, tự động cuộn xuống tin nhắn mới nhất và tối ưu trải nghiệm gõ phím trên thiết bị di động.

### 5. 📱 Tối ưu trải nghiệm Mobile & Responsive
- Thiết kế thích ứng mượt mà trên cả Desktop, Tablet và Mobile.
- Trên điện thoại: Cho phép chuyển đổi linh hoạt giữa chế độ chia đôi (Split view) hoặc phóng to (Expand) toàn màn hình cho phần Lịch hoặc Chatbox.
- Khóa Viewport thông minh (`100dvh`), ngăn hiện tượng giật layout hoặc đẩy trang khi mở bàn phím ảo.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Phiên bản |
| :--- | :--- | :--- |
| **Giao diện & Logic** | React | `^19.2.8` |
| **Công cụ Build** | Vite | `^8.3.0` |
| **Định kiểu (Styling)** | Tailwind CSS | `^4.3.3` |
| **Vite Tailwind Plugin** | `@tailwindcss/vite` | `^4.3.3` |
| **AWS SDK / Client** | AWS Amplify | `^6.22.2` |
| **UI Xác thực AWS** | `@aws-amplify/ui-react` | `^6.15.7` |
| **Bộ Icon** | Lucide React | `^1.59.0` |
| **Định tuyến (Routing)** | React Router DOM | `^7.18.4` |
| **Thông báo (Toast)** | React Hot Toast | `^2.6.1` |
| **Linter kiểm tra mã** | Oxlint | `^1.81.0` |

---

## 📂 Cấu trúc thư mục dự án

```text
frontend/
├── public/                       # Tài nguyên tĩnh công khai
├── src/
│   ├── api/
│   │   └── graphql.js            # GraphQL Queries, Mutations, Subscriptions & Amplify Client
│   ├── assets/                   # Hình ảnh, logo, banner
│   ├── components/               # Các UI component dùng chung
│   │   ├── AvailabilityModal.jsx # Modal đăng ký/chỉnh sửa lịch rảnh cá nhân
│   │   ├── Breadcrumb.jsx        # Thanh định hướng vị trí trang
│   │   ├── ChatBox.jsx           # Box chat nhóm thời gian thực
│   │   ├── CreateGroupModal.jsx  # Modal tạo nhóm mới
│   │   ├── DeleteAccountModal.jsx# Modal xác nhận xóa tài khoản
│   │   ├── DeleteGroupModal.jsx  # Modal xác nhận xóa nhóm (dành cho chủ nhóm)
│   │   ├── JoinGroupModal.jsx    # Modal nhập mã để tham gia nhóm
│   │   ├── LeaveGroupModal.jsx   # Modal xác nhận rời nhóm
│   │   ├── MembersListDropdown.jsx # Dropdown danh sách & trạng thái thành viên
│   │   ├── Navbar.jsx            # Thanh điều hướng phía trên cùng
│   │   ├── NotificationToast.jsx # Component thông báo tùy biến
│   │   └── ScheduleOverlapChart.jsx # Biểu đồ ma trận lịch rảnh & giờ trùng khớp
│   ├── pages/                    # Các trang chính của ứng dụng
│   │   ├── GroupsPage.jsx        # Trang danh sách nhóm và lối tắt tạo/tham gia nhóm
│   │   └── GroupDetailPage.jsx   # Trang chi tiết phòng hẹn (Lịch + Chat)
│   ├── utils/
│   │   └── dateUtils.js          # Tiện ích định dạng ngày giờ VN & thuật toán tính trùng lấn lịch
│   ├── App.css
│   ├── App.jsx                   # Cấu hình Authenticator Cognito & Router
│   ├── config.js                 # Cấu hình Cognito User Pool ID & AppSync Endpoint
│   ├── index.css                 # Định nghĩa theme Tailwind CSS & style toàn cục
│   └── main.jsx                  # Entry point của ứng dụng React
├── index.html                    # File HTML gốc
├── package.json                  # Khai báo dependencies và scripts
├── vite.config.js                # Cấu hình Vite & Tailwind v4
└── README.md                     # Tài liệu hướng dẫn frontend
```

---

## 📋 Yêu cầu môi trường

- **Node.js**: Phiên bản `18.x` trở lên (khuyên dùng `20.x` LTS).
- **npm**: Phiên bản `9.x` trở lên (hoặc `yarn` / `pnpm`).

---

## 🚀 Cài đặt và Khởi chạy

### 1. Di chuyển vào thư mục frontend
Nếu đang ở thư mục gốc của dự án:
```bash
cd frontend
```

### 2. Cài đặt các gói phụ thuộc (Dependencies)
```bash
npm install
```

### 3. Khởi chạy máy chủ phát triển (Development Server)
```bash
npm run dev
```
Sau khi khởi chạy thành công, mở trình duyệt và truy cập:
👉 [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Cấu hình AWS (Cognito & AppSync)

Cấu hình kết nối AWS được định nghĩa tại file [`src/config.js`](./src/config.js):

```javascript
import { Amplify } from 'aws-amplify';

export const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: 'us-east-1_xxxxxxxxx',          // User Pool ID từ Cognito
            userPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // App Client ID từ Cognito
            signUpVerificationMethod: 'code',
            loginWith: {
                email: true,
            },
        },
    },
    API: {
        GraphQL: {
            endpoint: 'https://xxxxxxxxxxxxxxxxxxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql', // GraphQL Endpoint
            region: 'us-east-1',
            defaultAuthMode: 'userPool',
        },
    },
};

Amplify.configure(awsConfig);
```

> 💡 **Lưu ý**: Khi deploy backend mới qua AWS CDK, bạn chỉ cần cập nhật lại `userPoolId`, `userPoolClientId` và `endpoint` tương ứng với output nhận được từ CloudFormation/CDK.

---

## 📜 Các lệnh có sẵn (Scripts)

| Lệnh | Mục đích |
| :--- | :--- |
| `npm run dev` | Khởi chạy máy chủ phát triển cục bộ với HMR (Hot Module Replacement) |
| `npm run build` | Đóng gói mã nguồn phục vụ môi trường production vào thư mục `dist/` |
| `npm run preview` | Xem trước bản build production trên máy cục bộ |
| `npm run lint` | Quét kiểm tra chất lượng mã nguồn bằng `oxlint` |

---

## 🎨 Thiết kế & Tối ưu giao diện

- **Màu sắc chủ đạo (Brand Theme)**:
  - Màu chủ đạo: `#008296` (AWS Teal)
  - Hover: `#0b6673`
  - Active: `#084d57`
  - Nền phụ trợ sáng: `#e6f4f6`
- **UI Nhất quán**: Hệ thống nút bấm bo góc nhẹ (`rounded-sm`), viền gọn gàng (`border-slate-200`), bảng màu chữ slate trung tính chuẩn phong cách Dashboard chuyên nghiệp.
- **Bàn phím ảo trên Mobile**: Tự động giữ focus khi gửi tin nhắn trong box chat, hạn chế tối đa việc bàn phím đóng mở liên tục gây khó chịu cho người dùng.
