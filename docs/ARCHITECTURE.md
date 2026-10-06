# Kiến trúc

## Các thành phần

Frontend là SPA React. `src/routes/AppRoutes.jsx` định nghĩa các route theo
vai trò; `ProtectedRoute.jsx` giới hạn việc điều hướng trên giao diện.
`AuthContext.jsx` giữ trạng thái người dùng, còn `services/apiClient.js`
tạo Axios client và đính kèm JWT vào request.

Backend là ứng dụng Spring Boot. Các lớp được tổ chức theo chức năng kỹ thuật:

| Package | Trách nhiệm |
| --- | --- |
| `controllers` | Nhận HTTP request và trả response |
| `dto` | Dữ liệu request/response theo nghiệp vụ |
| `service` | Xử lý nghiệp vụ và transaction |
| `repository` | Truy cập database qua Spring Data JPA |
| `models` | Entity và enum nghiệp vụ |
| `security` | Sinh/kiểm tra JWT, lọc request |
| `config` | Spring Security, CORS, password encoder |
| `exception` | Xử lý và biểu diễn lỗi |

Database PostgreSQL lưu người dùng, trung tâm, khóa học, lớp, lịch học,
đăng ký, thanh toán, điểm danh và yêu cầu học bù/bảo lưu. Hibernate quản lý
schema bằng `ddl-auto=update`; Liquibase hiện bị tắt.

## Luồng xác thực

1. Frontend gửi thông tin đăng nhập đến `POST /api/auth/login`.
2. Backend kiểm tra tài khoản, trạng thái khóa và mật khẩu.
3. Backend trả JWT và dữ liệu người dùng.
4. Frontend lưu token/user trong `sessionStorage` với khóa `gym-token` và
   `gym-user`, rồi gửi `Authorization: Bearer <token>` trên các request.
5. JWT filter xác thực request; Spring Security kiểm tra quyền theo prefix
   `/api/admin`, `/api/staff`, `/api/trainer` và `/api/member`.

Phân quyền ở frontend giúp điều hướng; quyền truy cập dữ liệu do backend
kiểm tra. Đăng ký công khai luôn tạo vai trò `MEMBER`.

## Chạy trực tiếp và chạy Docker

Khi chạy trực tiếp, Vite phục vụ frontend và trình duyệt gọi API qua
`VITE_API_URL=http://localhost:8080/api`. CORS hiện chấp nhận các origin
HTTP trên `localhost` và `127.0.0.1`.

Khi chạy Compose, Nginx phục vụ bản build frontend và chuyển request
`/api/` tới `backend:8080`, giữ nguyên URI. Backend kết nối tới `db:5432`.
Frontend mặc định dùng API cùng origin qua đường dẫn `/api`.

Database được lưu trong volume `postgres_data`. Docker build context của
mỗi service là folder tương ứng; `.dockerignore` loại thư viện local,
file build, cấu hình IDE và file môi trường.

## Phạm vi lịch sử Git

Repository gốc chứa cả frontend/backend. Lịch sử Git của hai repo cũ đã
được nhập, giữ nguyên các commit gốc. Commit backend `module package`
được giữ trong lịch sử nhưng nội dung checkout hiện tại vẫn theo phiên bản
`371ab51`; trong phiên bản này các controller nằm trực tiếp ở package
`controllers`.

Các bản sao Git phục vụ khôi phục nằm trong `.git-import-backup/` trên máy
đã thực hiện import. Thư mục này được ignore và không cần để clone hoặc
build project.
