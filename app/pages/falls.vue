<script setup lang="ts">
import { RefreshCw, Eye, X, AlertTriangle, Filter } from 'lucide-vue-next'
import type { FallEvent, TimelinePoint, TimelineResponse, FallListResponse } from '~/types'

const { apiFetch } = useApi()
const toast = useToast()

const falls = ref<FallEvent[]>([])
const total = ref(0)
const loading = ref(false)

const page = ref(1)
const pageSize = 20

const filterUser = ref('')
const filterFrom = ref('')
const filterTo = ref('')
const filterMinConfidence = ref('')

const detailModal = ref({ open: false, fall: null as FallEvent | null })

// ── Charts ──────────────────────────────────────────────────────────────────
const chartGroupBy = ref<'day' | 'week' | 'month'>('day')
const timeline = ref<TimelinePoint[]>([])
const timelineLoading = ref(false)

const chartGroupByOptions = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' }
]

const fetchTimeline = async () => {
  timelineLoading.value = true
  try {
    const data = await apiFetch<TimelineResponse>('/admin/stats/falls/timeline', {
      params: { group_by: chartGroupBy.value }
    })
    const labels = data?.labels ?? []
    const counts = data?.counts ?? []
    timeline.value = labels.map((date, i) => ({ date, count: counts[i] ?? 0 }))
  } catch {
    timeline.value = []
  } finally {
    timelineLoading.value = false
  }
}

const fetchFalls = async () => {
  loading.value = true
  try {
    const data = await apiFetch<FallListResponse>('/admin/stats/falls', {
      params: {
        page: page.value,
        page_size: pageSize,
        search: filterUser.value || undefined,
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

const formatNum = (n: number | null | undefined, unit = '') =>
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

    <!-- Chart full width -->
    <div class="card p-5">
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
      <div class="h-72">
        <div v-if="timelineLoading" class="h-full flex items-center justify-center">
          <AppSpinner />
        </div>
        <FallsBarChart v-else-if="timeline.length" :data="timeline" />
        <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm">
          Không có dữ liệu
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4 space-y-3">
      <div class="flex items-center gap-2 text-sm font-medium text-gray-600">
        <Filter class="w-4 h-4" />
        Bộ lọc
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          v-model="filterUser"
          type="text"
          placeholder="Tìm user (tên / email)..."
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
                <td v-for="j in 6" :key="j" class="px-4 py-3">
                  <div class="h-4 bg-gray-100 rounded animate-pulse" />
                </td>
              </tr>
            </template>
            <template v-else-if="falls.length === 0">
              <tr>
                <td colspan="6" class="px-4 py-16 text-center">
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
                <td class="px-4 py-3 text-gray-600 tabular-nums">
                  {{ formatNum(f.velocity, ' px/s') }}
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
                      {{ Math.round(f.confidence * 100) }}%
                    </span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {{ formatDateTime(f.timestamp || f.created_at) }}
                </td>
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
                  <p class="text-gray-400 text-xs mb-0.5">Thời điểm</p>
                  <p class="font-medium text-gray-900 text-xs leading-5">
                    {{ formatDateTime(detailModal.fall.timestamp || detailModal.fall.created_at) }}
                  </p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-400 text-xs mb-0.5">Vận tốc ngã</p>
                  <p class="font-semibold text-gray-900 text-base">{{ formatNum(detailModal.fall.velocity, ' px/s') }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3 col-span-2">
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