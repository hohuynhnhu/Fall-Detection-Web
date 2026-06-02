<script setup lang="ts">
import { RefreshCw, Eye, MessageSquareReply, ChevronRight, X } from 'lucide-vue-next'

const { apiFetch } = useApi()
const toast = useToast()

const reports = ref<any[]>([])
const total = ref(0)
const loading = ref(false)

const page = ref(1)
const pageSize = 20

const filterStatus = ref('')
const filterCategory = ref('')

const detailModal = ref({ open: false, report: null as any })
const statusModal = ref({ open: false, reportId: '', currentStatus: '', newStatus: '', loading: false })
const replyModal = ref({ open: false, reportId: '', userEmail: '', message: '', loading: false })

const statusFlow: Record<string, string[]> = {
  pending: ['in_progress', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: [],
  closed: []
}

const statusLabel: Record<string, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng'
}

const statusClass: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500'
}

const fetchReports = async () => {
  loading.value = true
  try {
    const data = await apiFetch<any>('/admin/reports', {
      params: {
        page: page.value,
        page_size: pageSize,
        status: filterStatus.value || undefined,
        category: filterCategory.value || undefined
      }
    })
    reports.value = data?.reports ?? data?.items ?? []
    total.value = data?.total ?? 0
  } catch {
    toast.add('error', 'Không thể tải danh sách báo cáo')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => { page.value = 1; fetchReports() }
const resetFilters = () => { filterStatus.value = ''; filterCategory.value = ''; page.value = 1; fetchReports() }

const openDetail = async (report: any) => {
  try {
    const data = await apiFetch<any>(`/admin/reports/${report.id}`)
    detailModal.value = { open: true, report: data }
  } catch {
    toast.add('error', 'Không thể tải chi tiết báo cáo')
  }
}

const openStatusModal = (report: any) => {
  const next = statusFlow[report.status] ?? []
  if (next.length === 0) return
  statusModal.value = {
    open: true,
    reportId: report.id,
    currentStatus: report.status,
    newStatus: next[0],
    loading: false
  }
}

const submitStatus = async () => {
  statusModal.value.loading = true
  try {
    await apiFetch(`/admin/reports/${statusModal.value.reportId}/status`, {
      method: 'PATCH',
      body: { status: statusModal.value.newStatus }
    })
    toast.add('success', 'Đã cập nhật trạng thái báo cáo')
    statusModal.value.open = false
    await fetchReports()
  } catch {
    toast.add('error', 'Không thể cập nhật trạng thái')
  } finally {
    statusModal.value.loading = false
  }
}

const openReplyModal = (report: any) => {
  replyModal.value = { open: true, reportId: report.id, userEmail: report.user_email || report.email || '', message: '', loading: false }
}

const submitReply = async () => {
  if (!replyModal.value.message.trim()) {
    toast.add('error', 'Vui lòng nhập nội dung phản hồi')
    return
  }
  replyModal.value.loading = true
  try {
    await apiFetch(`/admin/reports/${replyModal.value.reportId}/reply`, {
      method: 'POST',
      body: { message: replyModal.value.message }
    })
    toast.add('success', 'Đã gửi phản hồi đến người dùng')
    replyModal.value.open = false
    await fetchReports()
  } catch {
    toast.add('error', 'Không thể gửi phản hồi')
  } finally {
    replyModal.value.loading = false
  }
}

watch(page, fetchReports)
onMounted(fetchReports)

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Báo cáo & Hỗ trợ</h1>
        <p class="text-gray-500 text-sm mt-0.5">Tổng {{ total }} báo cáo</p>
      </div>
      <button class="btn-secondary" @click="fetchReports">
        <RefreshCw class="w-4 h-4" />
        Làm mới
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select v-model="filterStatus" class="input-field">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="resolved">Đã giải quyết</option>
          <option value="closed">Đã đóng</option>
        </select>
        <input
          v-model="filterCategory"
          type="text"
          placeholder="Lọc theo danh mục..."
          class="input-field"
          @keydown.enter="applyFilters"
        />
        <button class="btn-primary justify-center" @click="applyFilters">Lọc</button>
        <button class="btn-secondary justify-center" @click="resetFilters">Đặt lại</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/50">
              <th class="text-left px-4 py-3 font-medium text-gray-500">Người dùng</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Danh mục</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 max-w-xs">Nội dung</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Trạng thái</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Thời gian</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="border-b border-gray-50">
                <td v-for="j in 6" :key="j" class="px-4 py-3">
                  <div class="h-4 bg-gray-100 rounded animate-pulse" />
                </td>
              </tr>
            </template>
            <template v-else-if="reports.length === 0">
              <tr>
                <td colspan="6" class="px-4 py-12 text-center text-gray-400">
                  Không có báo cáo nào
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="r in reports"
                :key="r.id"
                class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900 truncate max-w-[160px]">{{ r.user_name || r.display_name || '—' }}</p>
                  <p class="text-xs text-gray-400 truncate max-w-[160px]">{{ r.user_email || r.email || '' }}</p>
                </td>
                <td class="px-4 py-3 text-gray-600">{{ r.category || '—' }}</td>
                <td class="px-4 py-3 text-gray-600 max-w-xs">
                  <p class="truncate">{{ r.content || r.message || '—' }}</p>
                </td>
                <td class="px-4 py-3">
                  <span :class="['badge', statusClass[r.status] ?? 'bg-gray-100 text-gray-500']">
                    {{ statusLabel[r.status] ?? r.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ formatDate(r.created_at) }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Xem chi tiết"
                      @click="openDetail(r)"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      v-if="statusFlow[r.status]?.length"
                      class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Cập nhật trạng thái"
                      @click="openStatusModal(r)"
                    >
                      <ChevronRight class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Phản hồi"
                      @click="openReplyModal(r)"
                    >
                      <MessageSquareReply class="w-4 h-4" />
                    </button>
                  </div>
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
              <h3 class="font-semibold text-gray-900 text-lg">Chi tiết báo cáo</h3>
              <button class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg" @click="detailModal.open = false">
                <X class="w-5 h-5" />
              </button>
            </div>
            <template v-if="detailModal.report">
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-400 text-xs mb-0.5">Người dùng</p>
                  <p class="font-medium text-gray-900">{{ detailModal.report.user_name || detailModal.report.display_name || '—' }}</p>
                  <p class="text-gray-500 text-xs">{{ detailModal.report.user_email || detailModal.report.email || '' }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-400 text-xs mb-0.5">Danh mục</p>
                  <p class="font-medium text-gray-900">{{ detailModal.report.category || '—' }}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-400 text-xs mb-0.5">Trạng thái</p>
                  <span :class="['badge mt-0.5', statusClass[detailModal.report.status] ?? 'bg-gray-100 text-gray-500']">
                    {{ statusLabel[detailModal.report.status] ?? detailModal.report.status }}
                  </span>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-gray-400 text-xs mb-0.5">Thời gian</p>
                  <p class="font-medium text-gray-900">{{ formatDate(detailModal.report.created_at) }}</p>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-sm">
                <p class="text-gray-400 text-xs mb-1">Nội dung báo cáo</p>
                <p class="text-gray-800 whitespace-pre-wrap">{{ detailModal.report.content || detailModal.report.message || '—' }}</p>
              </div>
              <div v-if="detailModal.report.admin_reply" class="bg-indigo-50 rounded-lg p-3 text-sm border border-indigo-100">
                <p class="text-indigo-400 text-xs mb-1">Phản hồi của admin</p>
                <p class="text-indigo-800 whitespace-pre-wrap">{{ detailModal.report.admin_reply }}</p>
              </div>
            </template>
            <div class="flex justify-end gap-3 pt-2">
              <button class="btn-secondary" @click="detailModal.open = false">Đóng</button>
              <button
                class="btn-primary"
                @click="openReplyModal(detailModal.report); detailModal.open = false"
              >
                <MessageSquareReply class="w-4 h-4" />
                Phản hồi
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Status Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="statusModal.open"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          @click.self="statusModal.open = false"
        >
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 class="font-semibold text-gray-900 text-lg mb-4">Cập nhật trạng thái</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-sm">
                <span class="text-gray-500">Hiện tại:</span>
                <span :class="['badge', statusClass[statusModal.currentStatus] ?? 'bg-gray-100']">
                  {{ statusLabel[statusModal.currentStatus] ?? statusModal.currentStatus }}
                </span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái mới</label>
                <select v-model="statusModal.newStatus" class="input-field">
                  <option
                    v-for="s in statusFlow[statusModal.currentStatus]"
                    :key="s"
                    :value="s"
                  >
                    {{ statusLabel[s] ?? s }}
                  </option>
                </select>
              </div>
            </div>
            <div class="flex gap-3 mt-6 justify-end">
              <button class="btn-secondary" :disabled="statusModal.loading" @click="statusModal.open = false">Hủy</button>
              <button class="btn-primary" :disabled="statusModal.loading" @click="submitStatus">
                <span v-if="statusModal.loading">Đang lưu...</span>
                <span v-else>Cập nhật</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Reply Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="replyModal.open"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          @click.self="replyModal.open = false"
        >
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-900 text-lg">Phản hồi báo cáo</h3>
              <button class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg" @click="replyModal.open = false">
                <X class="w-5 h-5" />
              </button>
            </div>
            <p v-if="replyModal.userEmail" class="text-sm text-gray-500 mb-3">
              Gửi đến: <span class="font-medium text-gray-700">{{ replyModal.userEmail }}</span>
              <span class="text-xs text-gray-400 ml-1">(qua Gmail)</span>
            </p>
            <textarea
              v-model="replyModal.message"
              rows="4"
              placeholder="Nhập nội dung phản hồi..."
              class="input-field resize-none w-full"
            />
            <div class="flex gap-3 mt-4 justify-end">
              <button class="btn-secondary" :disabled="replyModal.loading" @click="replyModal.open = false">Hủy</button>
              <button class="btn-primary" :disabled="replyModal.loading" @click="submitReply">
                <span v-if="replyModal.loading">Đang gửi...</span>
                <span v-else>Gửi phản hồi</span>
              </button>
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
