# API

Tài liệu này mô tả API trong backend đang được checkout, không phải đặc tả
OpenAPI đầy đủ. Xem controller và DTO để biết chính xác tham số, body và
response của từng endpoint.

- Chạy trực tiếp: `http://localhost:8080/api`.
- Qua frontend Compose: `http://localhost:5173/api`.
- API có quyền yêu cầu header `Authorization: Bearer <token>`.

## Xác thực

### Đăng ký

`POST /api/auth/register`

```json
{
  "email": "member@example.com",
  "password": "local-demo-password",
  "name": "Demo Member",
  "phoneNumber": "0900000001"
}
```

Tạo user `MEMBER`. Email và số điện thoại phải chưa được sử dụng. Response
thành công hiện là chuỗi `Register successfully`, không phải JWT.

Ví dụ PowerShell, sau khi backend đang chạy:

```powershell
$body = @{
    email = 'member@example.com'
    password = 'local-demo-password'
    name = 'Demo Member'
    phoneNumber = '0900000001'
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/auth/register' -ContentType 'application/json' -Body $body
```

### Đăng nhập

`POST /api/auth/login`

```json
{
  "email": "member@example.com",
  "password": "local-demo-password"
}
```

Response chứa `token` và `user`. Email khi đăng ký được chuẩn hóa thành chữ
thường; dùng đúng email đã lưu khi đăng nhập.

```powershell
$body = @{ email = 'member@example.com'; password = 'local-demo-password' } | ConvertTo-Json
$auth = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/auth/login' -ContentType 'application/json' -Body $body
$headers = @{ Authorization = "Bearer $($auth.token)" }
Invoke-RestMethod -Uri 'http://localhost:8080/api/member/registrations' -Headers $headers
```

## Các nhóm endpoint

Các đường dẫn trong bảng là base path; nhiều controller có thêm endpoint
con và HTTP method khác nhau.

| Nhóm | Base path | Quyền |
| --- | --- | --- |
| Đăng ký / đăng nhập | `/api/auth/register`, `/api/auth/login` | Công khai |
| Lớp công khai | `/api/public/classrooms` | Công khai |
| Huấn luyện viên công khai | `/api/public/trainers` | Công khai |
| Trung tâm | `/api/admin/centers` | ADMIN |
| Khóa học | `/api/admin/courses` | ADMIN |
| Lớp học | `/api/admin/classrooms` | ADMIN |
| Người dùng | `/api/admin/users` | ADMIN |
| Xử lý đăng ký | `/api/staff/registrations` | STAFF hoặc ADMIN |
| Thu tiền / ghi nhận thanh toán | `/api/staff/payments` | STAFF hoặc ADMIN |
| Xử lý học bù | `/api/staff/makeup`, `/api/staff/makeup-requests` | STAFF hoặc ADMIN |
| Xử lý bảo lưu | `/api/staff/freeze-requests` | STAFF hoặc ADMIN |
| Lớp, học viên và điểm danh | `/api/trainer/classrooms` | TRAINER hoặc ADMIN |
| Đăng ký của hội viên | `/api/member/registrations` | MEMBER hoặc ADMIN |
| Thanh toán của hội viên | `/api/member/payments` | MEMBER hoặc ADMIN |
| Thẻ hội viên | `/api/member/cards` | MEMBER hoặc ADMIN |
| Học bù | `/api/member/makeup`, `/api/member/makeup-requests` | MEMBER hoặc ADMIN |
| Bảo lưu / tiếp tục học | `/api/member/freeze-requests` | MEMBER hoặc ADMIN |
| Chuyển lớp | `/api/member/travel-classrooms` | MEMBER hoặc ADMIN |

## Đồng bộ frontend/backend

Frontend gọi `GET` và `PUT /api/account/profile`, nhưng checkout backend
hiện tại chưa có controller cho các endpoint này. Lịch sử backend có commit
`module package` bổ sung `AccountController`; việc giữ commit trong lịch sử
chung không làm endpoint xuất hiện trong code hiện tại.

Project chưa cấu hình Swagger UI hoặc endpoint health cho backend.
`/api/health` trong `gym-app-frontend/server.js` chỉ thuộc static server Node
của frontend; Docker frontend dùng Nginx và không cung cấp endpoint đó.
