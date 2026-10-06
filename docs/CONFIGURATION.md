# Cấu hình

## Ba nơi cấu hình

| Nơi | Cách đọc |
| --- | --- |
| `.env` ở thư mục gốc | Docker Compose đọc để thay biến trong `docker-compose.yml` |
| `gym-app-frontend/.env` | Vite đọc khi chạy dev hoặc build trực tiếp |
| Biến môi trường của backend | Spring Boot đọc để ghi đè `application.properties` |

Spring Boot trong project này không tự nạp file `.env`. Đặt biến trong
terminal chạy Maven hoặc truyền qua cấu hình container.

## Backend

| Biến | Mặc định / mục đích |
| --- | --- |
| `SERVER_PORT` | `8080` |
| `SPRING_DATASOURCE_URL` | Ghi đè toàn bộ JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | Ghi đè user mặc định `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Đặt mật khẩu database qua biến môi trường, không có giá trị mặc định |
| `DB_PASSWORD` | Mật khẩu database khi không ghi đè bằng `SPRING_DATASOURCE_PASSWORD`; bắt buộc trong Compose |
| `JWT_SECRET` | Khóa Base64; cấu hình có khóa mẫu phục vụ local |
| `JWT_EXPIRATION_MS` | `86400000` (24 giờ) |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Ghi đè chế độ `update` hiện tại |

URL mặc định trong `application.properties` còn hỗ trợ các placeholder
`GYM-APP_DB_HOST`, `GYM-APP_DB_PORT`, `GYM-APP_DB_NAME`. Để cấu hình dễ dàng
trên PowerShell và Compose, dùng `SPRING_DATASOURCE_URL`.

JWT secret cần là chuỗi Base64 biểu diễn ít nhất 32 byte cho khóa HMAC hiện
tại. Có thể tạo khóa local mới bằng Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

## Frontend

| Biến | Giá trị mẫu |
| --- | --- |
| `VITE_API_URL` | `http://localhost:8080/api` khi chạy Vite trực tiếp; `/api` khi chạy Compose |

Biến `VITE_*` được nhúng vào JavaScript và công khai cho trình duyệt, không
dùng để lưu password hay JWT secret. Sau khi đổi `.env`, khởi động lại Vite;
nếu dùng image, build lại frontend.

## Docker Compose

| Biến trong `.env` gốc | Mặc định |
| --- | --- |
| `FRONTEND_PORT` | `5173` |
| `BACKEND_PORT` | `8080` |
| `DB_NAME` | `gym-app` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | Bắt buộc đặt, không có giá trị mặc định |
| `VITE_API_URL` | `/api` |
| `JWT_EXPIRATION_MS` | `86400000` |
| `JWT_SECRET` | Khóa Base64 mẫu |

Compose truyền các thông số database sang Spring qua biến
`SPRING_DATASOURCE_*`. Không mở cổng PostgreSQL ra host. Các biến
`POSTGRES_*` dùng để tạo database/user lần đầu khi volume còn trống.

## Lỗi thường gặp

| Hiện tượng | Kiểm tra |
| --- | --- |
| `npm.ps1 cannot be loaded` | Dùng `npm.cmd` trên PowerShell |
| Maven wrapper báo `Cannot index into a null array` | Dùng `mvn.cmd` với Maven 3.9.x đã cài |
| Maven không tải được dependency | Kiểm tra kết nối tới Maven Central, proxy và chế độ offline |
| Backend không kết nối được database | Database đã tồn tại, JDBC URL, user/password và PostgreSQL đang chạy |
| Cổng 8080 hoặc 5173 đã được sử dụng | Đổi cổng backend/Vite; với Compose đổi `BACKEND_PORT` hoặc `FRONTEND_PORT` |
| Frontend gọi API sai địa chỉ | Kiểm tra đúng file `.env`, prefix `/api` và khởi động/build lại |
| Nginx trả 502 khi vừa khởi động | Xem log backend và chờ backend kết nối database, hoàn tất startup |
| 401 hoặc 403 | Kiểm tra token, trạng thái tài khoản và vai trò; đăng nhập lại sau khi đổi quyền |
| Profile không tải được | Checkout backend hiện tại chưa có `/api/account/profile` |
