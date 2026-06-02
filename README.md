# Fall Guard — Admin Panel

Web admin quản lý hệ thống phát hiện té ngã, xây dựng bằng Nuxt 4 (SPA). Đây là thành phần giao diện cho luận văn tốt nghiệp.

---

## Tech Stack

| Thành phần | Phiên bản |
|---|---|
| Nuxt | 4.x (SPA mode, `ssr: false`) |
| Vue | 3.5 |
| Tailwind CSS | via `@nuxtjs/tailwindcss` |
| Chart.js + vue-chartjs | Biểu đồ thống kê |
| lucide-vue-next | Icon set |

---

## Yêu cầu

- Node.js >= 18
- Backend API chạy tại `http://localhost:8000`

---

## Cài đặt & Chạy

```bash
# Cài dependencies
npm install

# Chạy dev server (mặc định http://localhost:3000)
npm run dev

# Build production
npm run build

# Preview bản build
npm run preview
```

Nếu backend chạy ở địa chỉ khác, sửa `apiBase` trong `nuxt.config.ts`:

```ts
runtimeConfig: {
  public: {
    apiBase: 'http://your-backend-host:port'
  }
}
```

---

## Cấu trúc thư mục

```
app/
├── pages/
│   ├── login.vue          # Đăng nhập
│   ├── index.vue          # Dashboard
│   ├── users/
│   │   ├── index.vue      # Danh sách người dùng
│   │   └── [id].vue       # Chi tiết người dùng
│   ├── reports.vue        # Báo cáo & Hỗ trợ
│   ├── notifications.vue  # Gửi thông báo FCM
│   └── config.vue         # Cấu hình hệ thống
├── layouts/
│   ├── default.vue        # Layout chính (sidebar + topbar)
│   └── auth.vue           # Layout trang đăng nhập
├── components/
│   ├── AppToast.vue        # Toast notification
│   ├── AppConfirmModal.vue # Modal xác nhận
│   ├── AppPagination.vue   # Phân trang
│   └── DashboardLineChart.vue
├── composables/
│   ├── useAuth.ts          # Quản lý token & user state
│   ├── useApi.ts           # HTTP client với auth header
│   └── useToast.ts         # Toast notification system
└── middleware/
    └── auth.global.ts      # Bảo vệ toàn bộ route
```

---

## Xác thực

- Đăng nhập qua `POST /auth/login` → nhận `id_token`
- Token lưu trong `localStorage` với key `id_token`
- Middleware `auth.global.ts` chạy trên mọi route, trừ `/login`
- Gọi `GET /admin/me` để verify token và lấy thông tin user
- Chỉ tài khoản có `role === "admin"` được truy cập

---

## Composables

### `useAuth()`
```ts
const { token, user, isAuthenticated, isAdmin, setToken, clearAuth, initAuth } = useAuth()
```
- `token` — Bearer token hiện tại
- `user` — `{ id, email, display_name, role, is_active, avatar_url, phone }`
- `setToken(token)` — lưu token vào state + localStorage
- `clearAuth()` — xóa token và user state
- `initAuth()` — khôi phục từ localStorage khi app khởi động

### `useApi()`
```ts
const { apiFetch } = useApi()

const data = await apiFetch<ResponseType>('/endpoint', {
  method: 'POST',
  body: { key: 'value' },
  params: { page: 1 }
})
```
- Tự thêm `Authorization: Bearer <token>` vào mọi request
- Tự lọc params `undefined / null / ''` khỏi query string
- `401` → xóa auth, redirect về `/login`
- `403` → hiển thị toast lỗi

### `useToast()`
```ts
const toast = useToast()
toast.add('success' | 'error' | 'info' | 'warning', 'Nội dung thông báo')
```
Toast tự động biến mất sau 4 giây.

---

## Các trang

### Dashboard `/`
- Thẻ thống kê: tổng users, đang hoạt động, số vụ té ngã hôm nay / tháng này / tổng
- Biểu đồ đường theo ngày / tuần / tháng
- Trạng thái server health

**API:** `GET /admin/stats/overview`, `GET /admin/stats/falls/timeline`, `GET /health`

---

### Quản lý người dùng `/users`
- Bảng danh sách với filter: email, vai trò, trạng thái hoạt động
- Phân trang 20 bản ghi/trang
- Thao tác: xem chi tiết, kích hoạt/vô hiệu hóa, đổi quyền, xóa

**API:** `GET /admin/users`, `PATCH /admin/users/{id}/activate`, `PATCH /admin/users/{id}/deactivate`, `PATCH /admin/users/{id}/role`, `DELETE /admin/users/{id}`

---

### Chi tiết người dùng `/users/[id]`
- Thông tin profile (có thể chỉnh sửa display_name, avatar)
- Danh sách thành viên gia đình
- Danh sách liên lạc khẩn cấp
- Lịch sử té ngã (thời gian, vận tốc, độ tin cậy, clip video)

**API:** `GET /admin/users/{id}/profile`, `GET /admin/users/{id}/falls`, `PATCH /admin/users/{id}/profile`

---

### Báo cáo & Hỗ trợ `/reports`
- Bảng báo cáo từ người dùng với filter theo trạng thái và danh mục
- Luồng trạng thái: `pending → in_progress → resolved / closed`
- Xem chi tiết: thông tin user, nội dung báo cáo, phản hồi cũ (nếu có)
- Cập nhật trạng thái qua dropdown (chỉ hiện option hợp lệ theo flow)
- Phản hồi báo cáo → tự động gửi FCM đến thiết bị người dùng

**API:** `GET /admin/reports`, `GET /admin/reports/{id}`, `PATCH /admin/reports/{id}/status`, `POST /admin/reports/{id}/reply`

---

### Gửi thông báo `/notifications`
- Chọn đối tượng: **Tất cả người dùng** (broadcast) hoặc **Một người dùng** (nhập User ID)
- Nhập tiêu đề (tối đa 100 ký tự) và nội dung (tối đa 500 ký tự)
- Preview thông báo trực tiếp trước khi gửi
- Gửi qua FCM

**API:** `POST /admin/notifications/send` — body `{ user_id: string | null, title, message }`

---

### Cấu hình hệ thống `/config`
- Chọn camera (`cam_0`, `cam_1`, `cam_2`)
- Chỉnh ngưỡng phát hiện (thresholds) — các trường động từ API
- Bật/tắt tính năng (features toggles) — dynamic từ API
- Nút reset về giá trị mặc định

**API:** `GET /config/thresholds`, `PATCH /config/thresholds`, `POST /config/thresholds/reset`, `GET /config/features`, `PATCH /config/features`

---

## Danh sách API đầy đủ

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/login` | Đăng nhập |
| GET | `/admin/me` | Lấy thông tin admin hiện tại |
| GET | `/admin/stats/overview` | Thống kê tổng quan |
| GET | `/admin/stats/falls/timeline` | Dữ liệu biểu đồ té ngã |
| GET | `/admin/users` | Danh sách người dùng |
| PATCH | `/admin/users/{id}/activate` | Kích hoạt tài khoản |
| PATCH | `/admin/users/{id}/deactivate` | Vô hiệu hóa tài khoản |
| PATCH | `/admin/users/{id}/role` | Đổi quyền |
| DELETE | `/admin/users/{id}` | Xóa người dùng |
| GET | `/admin/users/{id}/profile` | Chi tiết hồ sơ người dùng |
| PATCH | `/admin/users/{id}/profile` | Cập nhật hồ sơ |
| GET | `/admin/users/{id}/falls` | Lịch sử té ngã |
| GET | `/admin/reports` | Danh sách báo cáo |
| GET | `/admin/reports/{id}` | Chi tiết báo cáo |
| PATCH | `/admin/reports/{id}/status` | Cập nhật trạng thái báo cáo |
| POST | `/admin/reports/{id}/reply` | Phản hồi báo cáo (gửi FCM) |
| POST | `/admin/notifications/send` | Gửi thông báo FCM |
| GET | `/config/thresholds` | Lấy ngưỡng phát hiện |
| PATCH | `/config/thresholds` | Cập nhật ngưỡng |
| POST | `/config/thresholds/reset` | Reset ngưỡng về mặc định |
| GET | `/config/features` | Lấy danh sách tính năng |
| PATCH | `/config/features` | Cập nhật tính năng |
| GET | `/health` | Kiểm tra trạng thái server |
