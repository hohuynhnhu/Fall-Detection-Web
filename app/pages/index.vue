<script setup lang="ts">
import {
  Users,
  UserCheck,
  Activity,
  Calendar,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-vue-next'

const { apiFetch } = useApi()
const toast = useToast()

// --- Stats Overview ---
const stats = ref<any>(null)
const statsLoading = ref(true)

// --- Timeline Chart ---
const groupBy = ref<'day' | 'week' | 'month'>('day')
const timeline = ref<any[]>([])
const timelineLoading = ref(true)

// --- Health ---
const health = ref<any>(null)
const healthLoading = ref(true)

const statCards = computed(() => [
  {
    label: 'Tổng người dùng',
    value: stats.value?.total_users ?? '—',
    icon: Users,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    label: 'Người dùng đang hoạt động',
    value: stats.value?.active_users ?? '—',
    icon: UserCheck,
    color: 'bg-green-50 text-green-600'
  },
  {
    label: 'Té ngã hôm nay',
    value: stats.value?.total_falls_today ?? '—',
    icon: Activity,
    color: 'bg-red-50 text-red-600'
  },
  {
    label: 'Té ngã tháng này',
    value: stats.value?.total_falls_this_month ?? '—',
    icon: Calendar,
    color: 'bg-amber-50 text-amber-600'
  },
  {
    label: 'Tổng tất cả thời gian',
    value: stats.value?.total_falls_all_time ?? '—',
    icon: TrendingUp,
    color: 'bg-indigo-50 text-indigo-600'
  }
])

const groupByOptions = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' }
]

const fetchStats = async () => {
  statsLoading.value = true
  try {
    stats.value = await apiFetch('/admin/stats/overview')
  } catch {
    toast.add('error', 'Không thể tải thống kê tổng quan')
  } finally {
    statsLoading.value = false
  }
}

const fetchTimeline = async () => {
  timelineLoading.value = true
  try {
    const data = await apiFetch<any>('/admin/stats/falls/timeline', {
      params: { group_by: groupBy.value }
    })

    // Transform: { labels, counts } → [{ date, count }]
    const labels: string[] = data?.labels ?? []
    const counts: number[] = data?.counts ?? []
    timeline.value = labels.map((date, i) => ({ date, count: counts[i] ?? 0 }))

  } catch (e) {
    console.error('[timeline error]', e)
    toast.add('error', 'Không thể tải dữ liệu biểu đồ')
  } finally {
    timelineLoading.value = false
  }
}

const fetchHealth = async () => {
  healthLoading.value = true
  try {
    health.value = await apiFetch('/health')
  } catch {
    health.value = { status: 'error' }
  } finally {
    healthLoading.value = false
  }
}

watch(groupBy, fetchTimeline)

onMounted(async () => {
  await Promise.all([fetchStats(), fetchTimeline(), fetchHealth()])
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-500 text-sm mt-0.5">Tổng quan hệ thống phát hiện té ngã</p>
      </div>
      <button
        class="btn-secondary"
        @click="() => { fetchStats(); fetchTimeline(); fetchHealth() }"
      >
        <RefreshCw class="w-4 h-4" />
        Làm mới
      </button>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="card p-5"
      >
        <div v-if="statsLoading" class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-3" />
          <div class="h-8 bg-gray-200 rounded w-1/2" />
        </div>
        <template v-else>
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm text-gray-500 leading-tight">{{ card.label }}</p>
            <div :class="['w-9 h-9 rounded-lg flex items-center justify-center', card.color]">
              <component :is="card.icon" class="w-5 h-5" />
            </div>
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ card.value }}</p>
        </template>
      </div>
    </div>

    <!-- Chart + Health -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Line chart -->
      <div class="card p-6 lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-semibold text-gray-900">Biểu đồ té ngã theo thời gian</h2>
          <div class="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              v-for="opt in groupByOptions"
              :key="opt.value"
              :class="[
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                groupBy === opt.value
                  ? 'bg-white shadow text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              ]"
              @click="groupBy = opt.value as any"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="h-64">
          <div v-if="timelineLoading" class="h-full flex items-center justify-center">
            <svg class="w-8 h-8 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <DashboardLineChart v-else-if="timeline.length" :data="timeline" />
          <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm">
            Không có dữ liệu
          </div>
        </div>
      </div>

      <!-- Health status -->
      <div class="card p-6">
        <h2 class="font-semibold text-gray-900 mb-4">Trạng thái server</h2>

        <div v-if="healthLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>

        <template v-else-if="health">
          <div class="flex items-center gap-3 mb-4">
            <CheckCircle v-if="health.status === 'ok' || health.status === 'healthy'" class="w-6 h-6 text-green-500" />
            <XCircle v-else class="w-6 h-6 text-red-500" />
            <div>
              <p class="font-medium text-gray-900 capitalize">{{ health.status }}</p>
              <p class="text-xs text-gray-500">
                {{ health.status === 'ok' || health.status === 'healthy' ? 'Hệ thống hoạt động bình thường' : 'Có sự cố xảy ra' }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="(value, key) in health"
              v-show="key !== 'status'"
              :key="key"
              class="flex justify-between text-sm"
            >
              <span class="text-gray-500 capitalize">{{ String(key).replace(/_/g, ' ') }}</span>
              <span class="font-medium text-gray-700 truncate ml-2">{{ value }}</span>
            </div>
          </div>
        </template>

        <div v-else class="text-gray-400 text-sm">Không thể kết nối server</div>
      </div>
    </div>
  </div>
</template>
