# Code Review — Fall Guard Admin Panel

> Ngày đánh giá: 2026-06-02  
> Phiên bản: Nuxt 4 SPA

---

## 1. Tổng quan project

| Mục | Chi tiết |
|-----|----------|
| Framework | Nuxt 4 (SPA mode) |
| UI | Vue 3 Composition API + Tailwind CSS |
| Charts | Chart.js 4 qua `vue-chartjs` |
| Icons | `lucide-vue-next` |
| HTTP | `$fetch` (ofetch) qua composable `useApi` |
| Auth | JWT lưu `localStorage`, global route middleware |

**Cấu trúc thư mục:**
```
app/
├── assets/css/main.css          # Tailwind + utility classes
├── components/
│   ├── AppToast.vue             # Toast notification
│   ├── AppConfirmModal.vue      # Modal xác nhận xóa/sửa
│   ├── AppPagination.vue        # Phân trang tái sử dụng
│   ├── DashboardLineChart.vue   # Biểu đồ đường (dashboard)
│   ├── FallsBarChart.vue        # Biểu đồ cột (falls)
│   ├── FallsCameraChart.vue     # Biểu đồ theo camera
│   └── FallsDoughnutChart.vue   # Biểu đồ tròn độ tin cậy
├── composables/
│   ├── useApi.ts                # HTTP client trung tâm
│   ├── useAuth.ts               # Auth state + localStorage
│   └── useToast.ts              # Global toast state
├── layouts/
│   ├── default.vue              # Layout chính (sidebar + topbar)
│   └── auth.vue                 # Layout trang login
├── middleware/auth.global.ts    # Kiểm tra auth + role admin
├── pages/
│   ├── index.vue                # Dashboard
│   ├── login.vue
│   ├── falls.vue                # Lịch sử té ngã
│   ├── notifications.vue        # Gửi email thông báo
│   ├── reports.vue              # Báo cáo & hỗ trợ
│   ├── config.vue               # Cấu hình hệ thống
│   └── users/
│       ├── index.vue            # Danh sách người dùng
│       └── [id].vue             # Chi tiết người dùng
└── plugins/chartjs.client.ts    # Đăng ký Chart.js components
```

---

## 2. Điểm mạnh

### Composables layer — tốt
- **`useApi`**: Xử lý tập trung headers, auth token, lọc params rỗng/null, redirect 401, toast 403. Đây là layer sạch nhất trong project.
- **`useAuth`**: Dùng `useState` của Nuxt để share state toàn app, tự sync `localStorage`. Đúng pattern.
- **`useToast`**: Đơn giản, đủ dùng, có auto-dismiss 4s.

### Utility CSS classes — tốt
`main.css` định nghĩa `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input-field`, `.card`, `.badge` → tránh lặp class dài trong template, consistent style toàn app.

### Reusable components — tốt
`AppToast`, `AppConfirmModal`, `AppPagination` tách ra đúng chỗ, nhận props rõ ràng, emit events đúng kiểu. `AppPagination` có thuật toán ellipsis trang chuẩn.

### Global middleware — đúng hướng
`auth.global.ts` kiểm tra token → fetch `/admin/me` → verify role `admin` → redirect nếu không hợp lệ. Không cần thêm middleware riêng từng trang.

### UI pattern nhất quán
Mọi trang đều theo cùng pattern: loading skeleton → fetch → toast lỗi → render. Sidebar highlight active route, mobile responsive sidebar với overlay.

---

## 3. Vấn đề cần cải thiện

### 3.1 Lạm dụng `any` — nghiêm trọng

Gần như 100% API response được type là `any`:

```ts
// Xuất hiện ở mọi trang
const stats = ref<any>(null)
const data = await apiFetch<any>('/admin/stats/overview')
users.value = data?.users ?? data?.items ?? []  // không biết shape
```

**Hậu quả:** TypeScript không cảnh báo khi truy cập sai field, refactor dễ gây bug ngầm, IDE không có autocomplete.

**Nên làm:** Định nghĩa interfaces cho từng domain:
```ts
interface User { id: string; email: string; display_name: string; role: string; is_active: boolean }
interface FallEvent { id: string; camera_id: string; confidence: number; timestamp: string; velocity: number; angle: number }
interface PaginatedResponse<T> { items: T[]; total: number }
```

---

### 3.2 Duplicate code — trung bình

**`formatDate` copy-paste 5 lần** (index, users/index, falls, users/[id], reports):
```ts
// Xuất hiện lặp lại ở mọi trang với cú pháp gần giống nhau
const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { ... }) : '—'
```

**Spinner SVG** inline lặp lại 5+ lần thay vì tách thành component `<AppSpinner />`.

**CSS modal animation** lặp lại trong 5 file (falls, reports, users/index, users/[id], notifications):
```css
/* Lặp nguyên xi trong từng file */
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
```

**`confidenceClass` / `confidenceLabel`** được viết trong `falls.vue`, trong khi `users/[id].vue` viết lại thành `confidenceColor` với ngưỡng khác (0.8/0.5 vs 0.85/0.6) — không đồng nhất.

---

### 3.3 `config.vue` bị thiếu phần Thresholds — nghiêm trọng

File `config.vue` có đoạn raw text trơ trong template (dòng 130–131):
```html
    Thresholds
    
    <!-- Features -->
```

Toàn bộ phần UI cấu hình ngưỡng (thresholds) không được render — chỉ còn lại phần "Tính năng hệ thống". Logic fetch/save thresholds có đầy đủ trong `<script>` nhưng template tương ứng bị thiếu hoặc bị xóa nhầm.

---

### 3.4 `InfoRow` component inline — không chuẩn

Trong `users/[id].vue` có một second `<script lang="ts">` block định nghĩa component bằng render function `h()`:
```ts
// Trong <script lang="ts"> thứ hai — không phải <script setup>
const InfoRow = defineComponent({
  props: { label: String, value: String },
  setup(props, { slots }) {
    return () => h('div', ...)
  }
})
```
Đây là pattern không cần thiết và khó đọc. Nên tách thành file `InfoRow.vue` riêng.

---

### 3.5 Biểu đồ confidence và camera trong `falls.vue` chỉ tính trang hiện tại

```ts
const confidenceCounts = computed(() => ({
  high: falls.value.filter(f => f.confidence >= 0.85).length,  // chỉ 20 records trang này
  ...
}))
```

Biểu đồ Doughnut và Camera Chart chỉ phản ánh 20 bản ghi của trang hiện tại, không phải toàn bộ dataset — UI có ghi chú "Trang hiện tại" nhưng dễ gây hiểu nhầm cho người dùng.

---

### 3.6 Filter hardcode role trong `users/index.vue`

```ts
params: {
  role: 'user',  // hardcoded, admin bị ẩn khỏi danh sách mà không có UI chỉ báo
}
```

Người dùng có thể không biết danh sách này không bao gồm tài khoản admin.

---

### 3.7 Token lưu `localStorage` — bảo mật thấp

JWT lưu `localStorage` dễ bị XSS đọc. Với admin panel, nên cân nhắc `httpOnly cookie` ở server hoặc ít nhất `sessionStorage`. Tuy nhiên đây thường là trade-off chấp nhận được với Nuxt SPA.

---

## 4. Tổng hợp đánh giá

| Tiêu chí | Điểm | Nhận xét |
|----------|------|----------|
| Kiến trúc / Cấu trúc thư mục | 8/10 | Rõ ràng, đúng conventions Nuxt |
| Tái sử dụng code | 5/10 | Composables tốt nhưng nhiều duplicate trong pages |
| TypeScript | 4/10 | Có dùng TS nhưng `any` gần như toàn bộ API layer |
| UI nhất quán | 8/10 | Design system mini qua Tailwind classes, dùng đồng nhất |
| Xử lý lỗi | 7/10 | Toast error khắp nơi, 401/403 xử lý tập trung |
| Hoàn thiện tính năng | 6/10 | `config.vue` thiếu phần thresholds UI |
| Bảo mật | 6/10 | JWT localStorage, có role check middleware |

**Điểm tổng: 6.3 / 10**

---

## 5. Ưu tiên sửa (theo thứ tự)

1. **[Cao]** Hoàn thiện template thresholds trong `config.vue`
2. **[Cao]** Định nghĩa interfaces TypeScript cho User, FallEvent, Report — bỏ `any`
3. **[Trung bình]** Extract `formatDate`, `confidenceClass/Label` vào `utils.ts` dùng chung
4. **[Trung bình]** Tạo component `<AppSpinner />` thay thế SVG inline lặp lại
5. **[Thấp]** Tách `InfoRow` trong `users/[id].vue` thành component riêng
6. **[Thấp]** Chuyển CSS animation modal sang global style hoặc plugin
