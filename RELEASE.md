# Phát hành Unitech Pricing (Windows EXE + Auto Update)

## Một lệnh phát hành

Sau khi hoàn tất tính năng và đã commit tất cả thay đổi, chạy:

```bat
release.bat
```

Script tự tăng patch, ví dụ `0.1.1` thành `0.1.2`. Chỉ dùng
`release.bat v0.2.0` khi cần chủ động phát hành bản minor/major.

Script sẽ tự động:

1. Tự lấy mọi thay đổi hiện tại vào đúng bản release đó.
2. Kiểm tra private key ký updater trên máy.
3. Build frontend, chạy test và `cargo check`.
4. Đồng bộ version tại `src-tauri/tauri.conf.json` và `src-tauri/Cargo.toml`.
5. Đóng gói bộ cài Windows `.exe` tại máy.
6. Ký gói updater (`.sig`).
7. Commit version, push `main`, tạo/push tag.
8. GitHub Actions nhận tag và xuất GitHub Release có `.exe`, `.sig`, `latest.json`.

## Điều kiện trên máy phát hành

- Node.js + npm, Rust toolchain, Visual Studio C++ Build Tools và WebView2 Runtime.
- Đăng nhập GitHub CLI (`gh auth status`).
- Private updater key còn nguyên tại:

```text
%LOCALAPPDATA%\UnitechPricing\updater\unitech-pricing.key
```

Không được đưa key này vào Git, gửi qua chat hoặc đổi key khi app đã có người cài. GitHub Actions dùng bản sao key trong secret `TAURI_SIGNING_PRIVATE_KEY`.

## File tạo ra

- Local: `src-tauri\target\release\bundle\nsis\*.exe`
- GitHub Release: installer `.exe`, `.sig` và `latest.json`.

`latest.json` là manifest mà app đang cài dùng để tìm bản mới qua GitHub Releases.
