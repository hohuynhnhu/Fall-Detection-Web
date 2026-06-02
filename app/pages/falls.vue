<script setup lang="ts">
import { RefreshCw, Eye, X, AlertTriangle, Filter } from 'lucide-vue-next'

const { apiFetch } = useApi()
const toast = useToast()

const falls = ref<any[]>([])
const total = ref(0)
const loading = ref(false)

const page = ref(1)
const pageSize = 20

const filterUser = ref('')
const filterCameraId = ref('')
const filterFrom = ref('')
const filterTo = ref('')
const filterMinConfidence = ref('')

const detailModal = ref({ open: false, fall: null as any })

// ── Charts ──────────────────────────────────────────────────────────────────
const chartGroupBy = ref<'day' | 'week' | 'month'>('day')
const timeline = ref<{ date: string; count: number }[]>([])
const timelineLoading = ref(false)

const chartGroupByOptions = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' }
]

const fetchTimeline = async () => {
  timelineLoading.value = true
  try {
    const data = await apiFetch<any>('/admin/stats/falls/timeline', {
      params: { group_by: chartGroupBy.value }
    })

    // Transform giống dashboard
    const labels: string[] = data?.labels ?? []
    const counts: number[] = data?.counts ?? []
    timeline.value = labels.map((date, i) => ({ date, count: counts[i] ?? 0 }))

  } catch {
    timeline.value = []
  } finally {
    timelineLoading.value = false
  }
}

const confidenceCounts = computed(() => ({
  high: falls.value.filter(f => f.confidence != null && f.confidence >= 0.85).length,
  med:  falls.value.filter(f => f.confidence != null && f.confidence >= 0.6 && f.confidence < 0.85).length,
  low:  falls.value.filter(f => f.confidence != null && f.confidence < 0.6).length
}))

const cameraData = computed(() => {
  const map: Record<string, number> = {}
  for (const f of falls.value) {
    if (f.camera_id) map[f.camera_id] = (map[f.camera_id] || 0) + 1
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
})

const hasCameraData = computed(() => cameraData.value.length > 0)
// ────────────────────────────────────────────────────────────────────────────

const confidenceClass = (c: number) => {
  if (c >= 0.85) return 'bg-red-100 text-red-700'
  if (c >= 0.6) return 'bg-orange-100 text-orange-700'
  return 'bg-yellow-100 text-yellow-700'
}

const confidenceLabel = (c: number) => {
  if (c >= 0.85) return 'Cao'
  if (c >= 0.6) return 'Trung bình'
  return 'Thấp'
}

const fetchFalls = async () => {
  loading.value = true
  try {
    const data = await apiFetch<any>('/admin/stats/falls', {
      params: {
        page: page.value,
        page_size: pageSize,
        search: filterUser.value || undefined,
        camera_id: filterCameraId.value || undefined,
        from_date: filterFrom.value || undefined,
        to_date: filterTo.value || undefined,
        min_confidence: filterMinConfidence.value || undefined
      }
    })
    falls.value = data?.falls ?? data?.items ?? []
    total.value = data?.total ?? 0
  } catch {
    toast.add('error', 'Không thể tải lịch sử té ngã')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => { page.value = 1; fetchFalls() }

const resetFilters = () => {
  filterUser.value = ''
  filterCameraId.value = ''
  filterFrom.value = ''
  filterTo.value = ''
  filterMinConfidence.value = ''
  page.value = 1
  fetchFalls()
}

const openDetail = (fall: any) => {
  detailModal.value = { open: true, fall }
}

watch(page, fetchFalls)
watch(chartGroupBy, fetchTimeline)
onMounted(() => Promise.all([fetchFalls(), fetchTimeline()]))

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

const formatNum = (n: any, unit = '') =>
  n != null ? `${Number(n).toFixed(2)}${unit}` : '—'
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Lịch sử té ngã</h1>
        <p class="text-gray-500 text-sm mt-0.5">Tổng {{ total }} sự kiện được ghi nhận</p>
      </div>
      <button class="btn-secondary" @click="() => { fetchFalls(); fetchTimeline() }">
        <RefreshCw class="w-4 h-4" />
        Làm mới
      </button>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- Timeline Bar Chart -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900 text-sm">Té ngã theo thời gian</h2>
          <div class="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              v-for="opt in chartGroupByOptions"
              :key="opt.value"
              :class="[
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                chartGroupBy === opt.value
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              ]"
              @click="chartGroupBy = opt.value as any"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="h-52">
          <div v-if="timelineLoading" class="h-full flex items-center justify-center">
            <svg class="w-7 h-7 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <FallsBarChart v-else-if="timeline.length" :data="timeline" />
          <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm">
            Không có dữ liệu
          </div>
        </div>
      </div>

      <!-- Confidence Doughnut -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900 text-sm">Phân bổ độ tin cậy</h2>
          <span class="text-xs text-gray-400">Trang hiện tại</span>
        </div>
        <div class="h-52">
          <div v-if="loading" class="h-full flex items-center justify-center">
            <svg class="w-7 h-7 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <FallsDoughnutChart
            v-else-if="falls.length"
            :high="confidenceCounts.high"
            :med="confidenceCounts.med"
            :low="confidenceCounts.low"
          />
          <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm">
            Không có dữ liệu
          </div>
        </div>
      </div>

      <!-- Camera Bar Chart -->
      <div v-if="hasCameraData" class="card p-5 lg:col-span-3">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900 text-sm">Số vụ té ngã theo Camera</h2>
          <span class="text-xs text-gray-400">Trang hiện tại</span>
        </div>
        <div class="h-44">
          <FallsCameraChart :data="cameraData" />
        </div>
      </div>

    </div>

    <!-- Filters -->
    <div class="card p-4 space-y-3">
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600">
        <Filter class="w-4 h-4" />
        Bộ lọc
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <input
          v-model="filterUser"
          type="text"
          placeholder="Tìm user (tên / email)..."
          class="input-field"
          @keydown.enter="applyFilters"
        />
        <input
          v-model="filterCameraId"
          type="text"
          placeholder="Camera ID..."
          class="input-field"
          @keydown.enter="applyFilters"
        />
        <div class="relative">
          <label class="absolute -top-2 left-2 text-[10px] text-gray-400 bg-white px-0.5">Từ ngày</label>
          <input v-model="filterFrom" type="datetime-local" class="input-field" />
        </div>
        <div class="relative">
          <label class="absolute -top-2 left-2 text-[10px] text-gray-400 bg-white px-0.5">Đến ngày</label>
          <input v-model="filterTo" type="datetime-local" class="input-field" />
        </div>
        <select v-model="filterMinConfidence" class="input-field">
          <option value="">Tất cả độ tin cậy</option>
          <option value="0.85">Cao (≥ 85%)</option>
          <option value="0.6">Trung bình (≥ 60%)</option>
          <option value="0">Tất cả</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button class="btn-primary" @click="applyFilters">Áp dụng</button>
        <button class="btn-secondary" @click="resetFilters">Đặt lại</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/50">
              <th class="text-left px-4 py-3 font-medium text-gray-500">Người dùng</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Camera</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Vận tốc</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Góc nghiêng</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Độ tin cậy</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Thời điểm</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr v-for="i in 8" :key="i" class="border-b border-gray-50">
                <td v-for="j in 7" :key="j" class="px-4 py-3">
                  <div class="h-4 bg-gray-100 rounded animate-pulse" />
                </td>
              </tr>
            </template>
            <template v-else-if="falls.length === 0">
              <tr>
                <td colspan="7" class="px-4 py-16 text-center">
                  <AlertTriangle class="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p class="text-gray-400">Không có sự kiện té ngã nào</p>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="f in falls"
                :key="f.id"
                class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900 truncate max-w-[160px]">{{ f.user_name || f.display_name || '—' }}</p>
                  <p class="text-xs text-gray-400 truncate max-w-[160px]">{{ f.user_email || f.email || '' }}</p>
                </td>
                <td class="px-4 py-3">
                  <span class="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {{ f.camera_id || '—' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-600 tabular-nums">
                  {{ formatNum(f.velocity, ' m/s') }}
                </td>
                <td class="px-4 py-3 text-gray-600 tabular-nums">
                  {{ formatNum(f.angle, '°') }}
                </td>
                <td class="px-4 py-3">
                  <div v-if="f.confidence != null" class="flex items-center gap-2">
                    <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="f.confidence >= 0.85 ? 'bg-red-500' : f.confidence >= 0.6 ? 'bg-orange-400' : 'bg-yellow-400'"
                        :style="{ width: `${Math.round(f.confidence * 100)}%` }"
                      />
                    </div>
                    <span :class="['badge text-xs', confidenceClass(f.confidence)]">
                      {{ Math.round(f.confidence * 100) }}% · {{ confidenceLabel(f.confidence) }}
                    </span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ formatDate(f.timestamp || f.created_at) }}</td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Xem chi tiết"
                    @click="openDetail(f)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="px-4 pb-4">
        <AppPagination v-model:page="page" :page-size="pageSize" :total="total" />
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="detailModal.open"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          @click.self="detailModal.open = false"
        >
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle class="w-4 h-4 text-red-600" />
                </div>
                <h3 class="font-semibold text-gray-900 text-lg">Chi tiết sự kiện té ngã</h3>
              </div>
              <button class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg" @click="detailModal.open = false">
                <X class="w-5 h-5" />
              </button>
            </div>

            <template v-if="detailModal.fall">
              <div class="bg-gray-50 rounded-xl p-4">
                <p class="text-xs text-gray-400 mb-1">Người dùng</p>
                <p class="font-semibold text-gray-900">{{ detailModal.fall.user_name || detailModal.fall.display_name || '—' }}</p>
                <p class="text-sm text-gray-500">{{ detailModal.fall.user_email || detailModal.fall.email || '' }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-400 text-xs mb-0.5">Camera</p>
                  <p class="font-mono font-medium text-gray-900">{{ detailModal.fall.camera_id || '—' }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-400 text-xs mb-0.5">Thời điểm</p>
                  <p class="font-medium text-gray-900 text-xs leading-5">{{ formatDate(detailModal.fall.timestamp || detailModal.fall.created_at) }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-400 text-xs mb-0.5">Vận tốc ngã</p>
                  <p class="font-semibold text-gray-900 text-base">{{ formatNum(detailModal.fall.velocity, ' m/s') }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-400 text-xs mb-0.5">Góc nghiêng</p>
                  <p class="font-semibold text-gray-900 text-base">{{ formatNum(detailModal.fall.angle, '°') }}</p>
                </div>
              </div>

              <div v-if="detailModal.fall.confidence != null" class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-gray-400 text-xs">Độ tin cậy phát hiện</p>
                  <span :class="['badge', confidenceClass(detailModal.fall.confidence)]">
                    {{ confidenceLabel(detailModal.fall.confidence) }}
                  </span>
                </div>
                <div class="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="detailModal.fall.confidence >= 0.85 ? 'bg-red-500' : detailModal.fall.confidence >= 0.6 ? 'bg-orange-400' : 'bg-yellow-400'"
                    :style="{ width: `${Math.round(detailModal.fall.confidence * 100)}%` }"
                  />
                </div>
                <p class="text-right text-xs font-semibold text-gray-700 mt-1">
                  {{ Math.round(detailModal.fall.confidence * 100) }}%
                </p>
              </div>

              <div v-if="detailModal.fall.location || detailModal.fall.notes" class="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div v-if="detailModal.fall.location">
                  <p class="text-gray-400 text-xs mb-0.5">Vị trí</p>
                  <p class="text-gray-800">{{ detailModal.fall.location }}</p>
                </div>
                <div v-if="detailModal.fall.notes">
                  <p class="text-gray-400 text-xs mb-0.5">Ghi chú</p>
                  <p class="text-gray-800">{{ detailModal.fall.notes }}</p>
                </div>
              </div>
            </template>

            <div class="flex justify-end pt-2">
              <button class="btn-secondary" @click="detailModal.open = false">Đóng</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
