<script setup lang="ts">
import { Search, RefreshCw, Eye, UserCheck, UserX, Shield, Trash2, ChevronDown } from 'lucide-vue-next'
import type { User, UserListResponse } from '~/types'

const { apiFetch } = useApi()
const toast = useToast()
const router = useRouter()

const users = ref<User[]>([])
const total = ref(0)
const loading = ref(false)

const page = ref(1)
const pageSize = 20

const filterEmail = ref('')
const filterActive = ref('')

const confirmModal = ref({
  open: false,
  title: '',
  message: '',
  loading: false,
  action: null as (() => Promise<void>) | null
})

const roleModal = ref({
  open: false,
  userId: '',
  currentRole: '',
  newRole: ''
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await apiFetch<UserListResponse>('/admin/users', {
      params: {
        page: page.value,
        page_size: pageSize,
        email: filterEmail.value || undefined,
        role: 'user',
        is_active: filterActive.value !== '' ? filterActive.value : undefined
      }
    })
    users.value = data?.users ?? data?.items ?? []
    total.value = data?.total ?? 0
  } catch {
    toast.add('error', 'Không thể tải danh sách người dùng')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  page.value = 1
  fetchUsers()
}

const resetFilters = () => {
  filterEmail.value = ''
  filterActive.value = ''
  page.value = 1
  fetchUsers()
}

const activateUser = (id: string, name: string) => {
  confirmModal.value = {
    open: true,
    title: 'Kích hoạt người dùng',
    message: `Bạn có chắc muốn kích hoạt tài khoản "${name}"?`,
    loading: false,
    action: async () => {
      await apiFetch(`/admin/users/${id}/activate`, { method: 'PATCH' })
      toast.add('success', 'Đã kích hoạt tài khoản thành công')
      await fetchUsers()
    }
  }
}

const deactivateUser = (id: string, name: string) => {
  confirmModal.value = {
    open: true,
    title: 'Vô hiệu hóa người dùng',
    message: `Bạn có chắc muốn vô hiệu hóa tài khoản "${name}"?`,
    loading: false,
    action: async () => {
      await apiFetch(`/admin/users/${id}/deactivate`, { method: 'PATCH' })
      toast.add('success', 'Đã vô hiệu hóa tài khoản')
      await fetchUsers()
    }
  }
}

const deleteUser = (id: string, email: string) => {
  confirmModal.value = {
    open: true,
    title: 'Xóa người dùng',
    message: `Hành động này không thể hoàn tác. Bạn có chắc muốn xóa tài khoản "${email}"?`,
    loading: false,
    action: async () => {
      await apiFetch(`/admin/users/${id}`, { method: 'DELETE' })
      toast.add('success', 'Đã xóa người dùng thành công')
      await fetchUsers()
    }
  }
}

const openRoleModal = (user: any) => {
  roleModal.value = {
    open: true,
    userId: user.id,
    currentRole: user.role,
    newRole: user.role === 'admin' ? 'user' : 'admin'
  }
}

const changeRole = async () => {
  try {
    await apiFetch(`/admin/users/${roleModal.value.userId}/role`, {
      method: 'PATCH',
      body: { role: roleModal.value.newRole }
    })
    toast.add('success', 'Đã cập nhật quyền người dùng')
    roleModal.value.open = false
    await fetchUsers()
  } catch {
    toast.add('error', 'Không thể đổi quyền người dùng')
  }
}

const runConfirm = async () => {
  if (!confirmModal.value.action) return
  confirmModal.value.loading = true
  try {
    await confirmModal.value.action()
    confirmModal.value.open = false
  } catch {
    toast.add('error', 'Thao tác thất bại. Vui lòng thử lại.')
  } finally {
    confirmModal.value.loading = false
  }
}

watch(page, fetchUsers)
onMounted(fetchUsers)
</script>

<template>
  <div class="p-6 space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p class="text-gray-500 text-sm mt-0.5">Tổng {{ total }} tài khoản</p>
      </div>
      <button class="btn-secondary" @click="fetchUsers">
        <RefreshCw class="w-4 h-4" />
        Làm mới
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="filterEmail"
            type="text"
            placeholder="Tìm theo email..."
            class="input-field pl-9"
            @keydown.enter="applyFilters"
          />
        </div>
        <select v-model="filterActive" class="input-field">
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã vô hiệu hóa</option>
        </select>
        <div class="flex gap-2">
          <button class="btn-primary flex-1 justify-center" @click="applyFilters">
            Lọc
          </button>
          <button class="btn-secondary" @click="resetFilters">
            Đặt lại
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/50">
              <th class="text-left px-4 py-3 font-medium text-gray-500">Email</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Họ tên</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Vai trò</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Trạng thái</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Ngày tạo</th>
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
            <template v-else-if="users.length === 0">
              <tr>
                <td colspan="6" class="px-4 py-12 text-center text-gray-400">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="u in users"
                :key="u.id"
                class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <td class="px-4 py-3 text-gray-900 font-medium">{{ u.email }}</td>
                <td class="px-4 py-3 text-gray-600">{{ u.display_name || '—' }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'badge',
                      u.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600'
                    ]"
                  >
                    {{ u.role === 'admin' ? 'Admin' : 'User' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'badge',
                      u.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    ]"
                  >
                    {{ u.is_active ? 'Hoạt động' : 'Vô hiệu' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500">{{ formatDate(u.created_at) }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Xem chi tiết"
                      @click="router.push(`/users/${u.id}`)"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      v-if="!u.is_active"
                      class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Kích hoạt"
                      @click="activateUser(u.id, u.display_name || u.email)"
                    >
                      <UserCheck class="w-4 h-4" />
                    </button>
                    <button
                      v-else
                      class="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Vô hiệu hóa"
                      @click="deactivateUser(u.id, u.display_name || u.email)"
                    >
                      <UserX class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Đổi quyền"
                      @click="openRoleModal(u)"
                    >
                      <Shield class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                      @click="deleteUser(u.id, u.email)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-4 pb-4">
        <AppPagination v-model:page="page" :page-size="pageSize" :total="total" />
      </div>
    </div>

    <!-- Confirm modal -->
    <AppConfirmModal
      :open="confirmModal.open"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :loading="confirmModal.loading"
      @confirm="runConfirm"
      @cancel="confirmModal.open = false"
    />

    <!-- Change role modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="roleModal.open"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          @click.self="roleModal.open = false"
        >
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 class="font-semibold text-gray-900 text-lg mb-4">Đổi quyền người dùng</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-sm">
                <span class="text-gray-500">Quyền hiện tại:</span>
                <span class="badge bg-gray-100 text-gray-700 capitalize">{{ roleModal.currentRole }}</span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Quyền mới</label>
                <select v-model="roleModal.newRole" class="input-field">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div class="flex gap-3 mt-6 justify-end">
              <button class="btn-secondary" @click="roleModal.open = false">Hủy</button>
              <button class="btn-primary" @click="changeRole">Cập nhật</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

