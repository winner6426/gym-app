# Gym App — APEX Fitness

Ứng dụng quản lý phòng gym với giao diện React và REST API Spring Boot.
Frontend và backend nằm trong cùng repository, phục vụ các vai trò quản trị
viên, nhân viên, huấn luyện viên và hội viên.

## Chức năng

| Vai trò | Các phần chức năng trong codebase |
| --- | --- |
| Khách | Trang chủ, xem huấn luyện viên và lớp học, đăng ký, đăng nhập |
| Admin | Quản lý người dùng, trung tâm, khóa học và lớp học |
| Staff | Xử lý đăng ký, thanh toán, yêu cầu hủy, bảo lưu và học bù |
| Trainer | Xem lớp phụ trách, danh sách học viên và điểm danh |
| Member | Đăng ký khóa học, xem lớp và thanh toán, yêu cầu bảo lưu, tiếp tục khóa học và học bù |

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite 7, React Router 7, Tailwind CSS 4, Axios |
| Backend | Java 17, Spring Boot 3.5.0, Spring Security, Spring Data JPA, Maven |
| Xác thực | JWT, mật khẩu được mã hóa qua Spring Security |
| Database | PostgreSQL |
| Docker | Multi-stage build, Nginx, Docker Compose, PostgreSQL 17 |

## Cấu trúc repository

```text
gym-app/
├── gym-app-backend/        # REST API, nghiệp vụ, JPA và bảo mật
│   ├── src/main/java/com/app/
│   ├── src/main/resources/application.properties
│   ├── pom.xml
│   └── Dockerfile
├── gym-app-frontend/       # Giao diện và API client
│   ├── src/
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
├── docs/                  # Kiến trúc, cấu hình và API
├── .github/               # CI, issue và pull request templates
├── docker-compose.yml
├── DOCKER.md
└── CONTRIBUTING.md
```

## Chạy local

Cần Git, JDK 17, Maven 3.9.x, Node.js 22.12 trở lên thuộc nhánh 22,
và một PostgreSQL đang hoạt động. Các ví dụ dưới đây dùng PowerShell.

### 1. Clone

```powershell
git clone https://github.com/winner6426/gym-app.git
cd gym-app
```

### 2. Chuẩn bị database

Tạo database `gym-app` bằng pgAdmin hoặc chạy SQL khi đang kết nối với
database `postgres`:

```sql
CREATE DATABASE "gym-app";
```

Cấu hình mặc định dùng `localhost:5432`, user `postgres`, mật khẩu `123456`.
Nếu database của bạn khác, đặt các biến môi trường tại terminal chạy backend:

```powershell
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5432/gym-app'
$env:SPRING_DATASOURCE_USERNAME = 'postgres'
$env:SPRING_DATASOURCE_PASSWORD = '<mat-khau-database-cua-ban>'
```

Hibernate đang dùng `ddl-auto=update` để tạo/cập nhật bảng. Chưa có migration
SQL hay seed dữ liệu tự động. Xem [cấu hình](docs/CONFIGURATION.md).

### 3. Khởi động backend

```powershell
cd gym-app-backend
mvn.cmd spring-boot:run
```

Backend mặc định chạy ở `http://localhost:8080`, API có prefix `/api`.
Trên macOS/Linux dùng `mvn spring-boot:run`. Repository có Maven wrapper
(`mvnw`, `mvnw.cmd`); nếu wrapper trên Windows báo `Cannot index into a null
array`, dùng Maven đã cài như lệnh trên.

### 4. Khởi động frontend

Mở terminal thứ hai, từ thư mục gốc:

```powershell
cd gym-app-frontend
Set-Content -Path .env -Value 'VITE_API_URL=http://localhost:8080/api'
npm.cmd ci
npm.cmd run dev
```

Frontend mặc định ở `http://localhost:5173`; xem URL thực tế Vite in ra nếu
cổng đã bị chiếm. Nếu đã có `.env`, sửa giá trị `VITE_API_URL` trong file
thay vì ghi đè. Trên macOS/Linux tạo `.env` chứa dòng
`VITE_API_URL=http://localhost:8080/api`, rồi dùng `npm ci` và `npm run dev`.
Trong PowerShell, `npm.cmd` tránh lỗi execution policy của `npm.ps1`.

### 5. Tài khoản đầu tiên

Đăng ký tại `/register` tạo tài khoản `MEMBER`. Code hiện tại không tự tạo
admin; các giá trị `app.admin.*` chưa được dùng để khởi tạo tài khoản.

Để có admin trên database local mới, đăng ký tài khoản của bạn trước rồi
cập nhật đúng user trong pgAdmin hoặc công cụ SQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Thay email bằng email đã đăng ký, sau đó đăng xuất và đăng nhập lại để lấy
JWT chứa vai trò mới. Không có tài khoản hoặc mật khẩu demo được seed sẵn.

## Docker

Để chỉ build image, chạy ở thư mục gốc:

```powershell
docker compose build
```

Khi muốn khởi động các container:

```powershell
docker compose up -d
```

Compose dùng một database riêng trong volume, không tự nhập dữ liệu từ
PostgreSQL local. Xem [hướng dẫn Docker](DOCKER.md) để đổi cấu hình và dừng
các service.

## Build và kiểm tra

Frontend:

```powershell
cd gym-app-frontend
npm.cmd run build
```

Backend, chạy trong một terminal ở thư mục gốc:

```powershell
cd gym-app-backend
mvn.cmd -B -ntp verify
```

Frontend tạo `dist/`, backend tạo JAR trong `target/`. Frontend chưa có
script lint/test; backend chưa có test tự động trong `src/test`. Build thành
công chưa xác nhận toàn bộ luồng nghiệp vụ chạy đúng với database.

GitHub Actions kiểm tra build của cả hai phần khi push vào `main` hoặc mở
pull request vào `main`; workflow không deploy và không build image Docker.

## Tài liệu

- [Kiến trúc và luồng dữ liệu](docs/ARCHITECTURE.md)
- [Biến môi trường và xử lý lỗi cấu hình](docs/CONFIGURATION.md)
- [API hiện có và ví dụ xác thực](docs/API.md)
- [Docker](DOCKER.md)
- [Hướng dẫn đóng góp](CONTRIBUTING.md)

## Trạng thái cấu hình hiện tại

Ứng dụng đang dùng cấu hình phục vụ chạy local. Khi triển khai, cần thay
mật khẩu/khóa mẫu, thiết lập database phù hợp và cấu hình CORS cho domain
thực tế. Frontend có màn hình profile gọi `/api/account/profile`, nhưng
backend đang được checkout chưa có controller cho endpoint đó; xem
[API](docs/API.md) trước khi kiểm tra luồng profile.
