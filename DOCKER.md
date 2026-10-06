# Build và chạy với Docker

Các file Docker dành cho bản build của ứng dụng: backend Java 17, frontend
React/Vite được phục vụ qua Nginx, và PostgreSQL 17. Cần Docker có Compose v2
và kết nối mạng để tải image, dependency Maven và npm.

## Chuẩn bị

Chạy tại thư mục gốc `gym-app`. Có thể dùng cấu hình mặc định hoặc tạo file
`.env` để tùy chỉnh cổng, database và JWT:

Tạo `.env` ở thư mục gốc với các giá trị bạn muốn thay đổi, ví dụ:

```dotenv
FRONTEND_PORT=5173
BACKEND_PORT=8080
DB_NAME=gym-app
DB_USER=postgres
DB_PASSWORD=123456
```

Đây là file `.env` ở thư mục gốc, riêng với file `.env` của frontend khi chạy
Vite trực tiếp. Các mật khẩu và khóa mặc định chỉ dành cho chạy local.
Các biến bổ sung được mô tả trong [cấu hình](docs/CONFIGURATION.md).

## Chỉ build image

```powershell
docker compose build
```

Lệnh này build frontend/backend, chưa khởi động container. Backend build
bằng Maven bên trong image, không cần Maven wrapper trên máy host. Frontend
cài dependency bằng `npm ci`; thư viện và file build local không được đưa vào
build context.

## Khi muốn chạy

```powershell
docker compose up -d
docker compose logs -f backend frontend
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api

Nginx chuyển tiếp `/api/` sang service `backend`, nên trình duyệt không cần
truy cập hostname nội bộ Docker. Cấu hình cũng hỗ trợ tải lại trang của React
Router. `VITE_API_URL` được nhúng lúc build; đổi giá trị này cần build lại
frontend.

Backend chờ PostgreSQL sẵn sàng trước khi khởi động. Frontend chờ container
backend được khởi động; API có thể cần thêm thời gian để sẵn sàng.

Database Docker dùng volume `postgres_data` mới, không tự lấy dữ liệu từ
PostgreSQL đang chạy trên máy. Không publish cổng database ra host để tránh
trùng cổng 5432. Hibernate tạo/cập nhật bảng theo cấu hình hiện tại; ứng dụng
hiện chưa tự tạo tài khoản admin hay dữ liệu mẫu.

## Dừng

```powershell
docker compose down
```

Volume database được giữ lại. Khi volume đã có dữ liệu, đổi `DB_NAME`,
`DB_USER` hoặc `DB_PASSWORD` trong `.env` không tự thay đổi database đã tạo.

Tham khảo: [Thứ tự khởi động Compose](https://docs.docker.com/compose/how-tos/startup-order).
