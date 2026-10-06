# Đóng góp

## Chuẩn bị

Đọc [README](README.md), thiết lập database và các biến môi trường local.
Frontend/backend dùng chung repo Git ở thư mục gốc; không tạo `.git` riêng
bên trong hai folder.

## Quy trình

1. Tạo nhánh mô tả công việc, ví dụ `feature/member-registration` hoặc
   `fix/payment-status`.
2. Giữ thay đổi tập trung vào vấn đề đang xử lý, theo cấu trúc code sẵn có.
3. Nếu thay API, cập nhật cả service frontend liên quan, DTO và tài liệu.
4. Chạy build phù hợp; kiểm tra thủ công các luồng bị ảnh hưởng với database
   local. Với thay đổi chức năng quan trọng, bổ sung test có ý nghĩa.
5. Commit từ thư mục gốc và mở pull request, mô tả kết quả cùng cách kiểm tra.

```powershell
git switch -c feature/member-registration
git add gym-app-backend/src gym-app-frontend/src
git diff --cached
git commit -m "Improve member registration"
```

Chỉ stage các file thuộc công việc thực tế. Không commit `.env`, password
thật, token, `node_modules`, `dist`, `target` hoặc bản sao Git.

## Kiểm tra

Tại `gym-app-frontend`:

```powershell
npm.cmd ci
npm.cmd run build
```

Tại `gym-app-backend`:

```powershell
mvn.cmd -B -ntp verify
```

Hiện frontend chưa có lint/test script và backend chưa có test tự động.
CI chỉ xác nhận build cùng các test nếu được bổ sung sau này, không xác
nhận toàn bộ nghiệp vụ hoặc kết nối database khi chạy ứng dụng.

## Quy ước

- Java dùng indentation 4 spaces; JavaScript/JSX, CSS, JSON, YAML dùng 2.
- Dùng tên file và cấu trúc theo các module lân cận.
- Giữ file lock npm khi thay dependency; không đổi dependency ngoài phạm vi.
- Cập nhật ví dụ cấu hình trong tài liệu nếu bổ sung biến môi trường.
- Nêu rõ nếu chưa chạy được một bước kiểm tra và nguyên nhân.

CI dựa trên [hướng dẫn Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
và [Maven](https://docs.github.com/en/actions/tutorials/build-and-test-code/java-with-maven)
của GitHub Actions.
