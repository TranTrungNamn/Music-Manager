# Tối ưu hiệu suất truy vấn PostgreSQL (Dự án Music Manager)

**Môn học:** Hệ quản trị Cơ sở dữ liệu  
**Đề tài:** PERFORMANCE - Tối ưu hiệu suất truy vấn và Mô phỏng Benchmark  
**Công nghệ sử dụng:** Docker, PostgreSQL, NestJS (Node.js), SQL Editor (PgAdmin)

---

## Giới thiệu

Dự án này mô phỏng một hệ thống quản lý âm nhạc (Music Manager) với lượng dữ liệu lớn nhằm mục đích phân tích và tối ưu hóa hiệu suất truy vấn trên PostgreSQL. Dự án sử dụng **Docker** để container hóa toàn bộ môi trường, đảm bảo tính nhất quán khi test hiệu năng.

## Kiến trúc & Cấu trúc Dữ liệu

Hệ thống xoay quanh 4 **entities** chính có mối quan hệ phức tạp:

- `Artists` (Nghệ sĩ)
- `Albums` (Album)
- `Tracks` (Bài hát)
- `Genres` (Thể loại)

## Cài đặt & Chạy dự án (với Docker)

1. Clone dự án về máy.
2. Khởi chạy Database và Backend thông qua Docker:
   ```powershell
   docker-compose up -d
   ```
