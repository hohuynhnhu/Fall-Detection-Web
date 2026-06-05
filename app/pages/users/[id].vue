<script setup lang="ts">
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  Edit2,
  ExternalLink,
  Users,
  AlertTriangle,
  Activity,
  X,
  Save
} from 'lucide-vue-next'
import type { FallEvent, UserProfile } from '~/types'

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const toast = useToast()

const userId = computed(() => route.params.id as string)

// Profile
const profile = ref<UserProfile | null>(null)
const profileLoading = ref(true)

// Falls history
const falls = ref<FallEvent[]>([])
const fallsTotal = ref(0)
const fallsPage = ref(1)
const fallsLoading = ref(false)
const fallsPageSize = 20

// Edit modal
const editModal = ref({
  open: false,
  loading: false,
  display_name: '',
  avatar_url: ''
})

const fetchProfile = async () => {
  profileLoading.value = true
  try {
    const data = await apiFetch<UserProfile>(`/admin/users/${userId.value}/profile`)
    profile.value = data
  } catch {
    toast.add('error', 'Không thể tải thông tin người dùng')
  } finally {
    profileLoading.value = false
  }
}

const fetchFalls = async () => {
  fallsLoading.value = true
  try {
    const data = await apiFetch<{ items: FallEvent[]; total: number }>(`/admin/users/${userId.value}/falls`, {
      params: { page: fallsPage.value, page_size: fallsPageSize }
    })
    falls.value = data?.items ?? []
    fallsTotal.value = data?.total ?? 0
  } catch {
    toast.add('error', 'Không thể tải lịch sử té ngã')
  } finally {
    fallsLoading.value = false
  }
}

const openEditModal = () => {
  editModal.value.display_name = profile.value?.user?.display_name || ''
  editModal.value.avatar_url = profile.value?.user?.avatar_url || ''
  editModal.value.open = true
}

const saveProfile = async () => {
  editModal.value.loading = true
  try {
    await apiFetch(`/admin/users/${userId.value}/profile`, {
      method: 'PATCH',
      body: {
        display_name: editModal.value.display_name,
        avatar_url: editModal.value.avatar_url || undefined
      }
    })
    toast.add('success', 'Đã cập nhật thông tin thành công')
    editModal.value.open = false
    await fetchProfile()
  } catch {
    toast.add('error', 'Không thể cập nhật thông tin')
  } finally {
    editModal.value.loading = false
  }
}

watch(fallsPage, fetchFalls)

onMounted(async () => {
  await Promise.all([fetchProfile(), fetchFalls()])
})

</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Back + header -->
    <div class="flex items-center gap-3">
      <button
        class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        @click="router.back()"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Chi tiết người dùng</h1>
        <p class="text-gray-500 text-sm">ID: {{ userId }}</p>
      </div>
    </div>

    <!-- Profile loading skeleton -->
    <div v-if="profileLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="card p-6 animate-pulse space-y-3">
        <div class="h-5 bg-gray-200 rounded w-1/2" />
        <div class="h-4 bg-gray-100 rounded w-full" />
        <div class="h-4 bg-gray-100 rounded w-3/4" />
      </div>
    </div>

    <!-- Profile content -->
    <template v-else-if="profile">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- User info card -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-indigo-500" />
              Thông tin cơ bản
            </h2>
            <button
              class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              @click="openEditModal"
            >
              <Edit2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Avatar -->
          <div class="flex justify-center mb-4">
            <img
              v-if="profile.user?.avatar_url"
              :src="profile.user.avatar_url"
              class="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              alt="Avatar"
            />
            <div
              v-else
              class="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center"
            >
              <span class="text-indigo-600 text-2xl font-bold uppercase">
                {{ (profile.user?.display_name || profile.user?.email || '?').charAt(0) }}
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <InfoRow label="Họ tên" :value="profile.user?.display_name || '—'" />
            <InfoRow label="Email" :value="profile.user?.email">
              <Mail class="w-3.5 h-3.5 text-gray-400" />
            </InfoRow>
            <InfoRow label="Số điện thoại" :value="profile.user?.phone_number || '—'">
              <Phone class="w-3.5 h-3.5 text-gray-400" />
            </InfoRow>
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500">Vai trò</span>
              <span
                :class="[
                  'badge',
                  profile.user?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                ]"
              >
                {{ profile.user?.role === 'admin' ? 'Admin' : 'User' }}
              </span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500">Trạng thái</span>
              <span
                :class="[
                  'badge',
                  profile.user?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                ]"
              >
                {{ profile.user?.is_active ? 'Hoạt động' : 'Vô hiệu' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Family members -->
        <div class="card p-6">
          <h2 class="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Users class="w-4 h-4 text-blue-500" />
            Thành viên gia đình
            <span class="ml-auto badge bg-blue-100 text-blue-700">
              {{ profile.family_members?.length ?? 0 }}
            </span>
          </h2>
          <div
            v-if="!profile.family_members?.length"
            class="text-center text-gray-400 text-sm py-6"
          >
            Chưa có thành viên
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="m in profile.family_members"
              :key="m.id"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span class="text-blue-600 text-xs font-bold uppercase">
                  {{ (m.name || m.email || '?').charAt(0) }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ m.name || m.display_name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ m.relationship || m.email }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Emergency contacts -->
        <div class="card p-6">
          <h2 class="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <AlertTriangle class="w-4 h-4 text-amber-500" />
            Liên hệ khẩn cấp
            <span class="ml-auto badge bg-amber-100 text-amber-700">
              {{ profile.emergency_contacts?.length ?? 0 }}
            </span>
          </h2>
          <div
            v-if="!profile.emergency_contacts?.length"
            class="text-center text-gray-400 text-sm py-6"
          >
            Chưa có liên hệ khẩn cấp
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="c in profile.emergency_contacts"
              :key="c.id"
              class="p-2 rounded-lg hover:bg-gray-50"
            >
              <p class="text-sm font-medium text-gray-900">{{ c.name }}</p>
              <p class="text-xs text-gray-500">{{ c.phone }}</p>
              <p v-if="c.relationship" class="text-xs text-gray-400">{{ c.relationship }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Falls history -->
    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900 flex items-center gap-2">
          <Activity class="w-4 h-4 text-red-500" />
          Lịch sử té ngã
          <span class="badge bg-red-100 text-red-600">{{ fallsTotal }}</span>
        </h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/50">
              <th class="text-left px-4 py-3 font-medium text-gray-500">Thời gian</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Trạng thái trước</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Vận tốc</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Độ tin cậy</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Video clip</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="fallsLoading">
              <tr v-for="i in 5" :key="i" class="border-b border-gray-50">
                <td v-for="j in 5" :key="j" class="px-4 py-3">
                  <div class="h-4 bg-gray-100 rounded animate-pulse" />
                </td>
              </tr>
            </template>
            <template v-else-if="falls.length === 0">
              <tr>
                <td colspan="5" class="px-4 py-12 text-center text-gray-400">
                  Chưa có lịch sử té ngã
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="f in falls"
                :key="f.id"
                class="border-b border-gray-50 hover:bg-gray-50/50"
              >
  <td class="px-4 py-3 text-gray-700">{{ f.datetime_vn || formatDateTime(Number(f.timestamp) * 1000) }}</td>
                <td class="px-4 py-3">
                  <span class="badge bg-gray-100 text-gray-600">{{ f.state_before || '—' }}</span>
                </td>
                <td class="px-4 py-3 text-gray-600">
                  {{ f.velocity != null ? `${Number(f.velocity).toFixed(2)} m/s` : '—' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    v-if="f.confidence != null"
                    :class="['badge', confidenceClass(f.confidence as number)]"
                  >
                    {{ ((f.confidence as number) * 100).toFixed(1) }}%
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3">
                  <a
                    v-if="f.clip_url"
                    :href="f.clip_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                    Xem clip
                  </a>
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="px-4 pb-4">
        <AppPagination v-model:page="fallsPage" :page-size="fallsPageSize" :total="fallsTotal" />
      </div>
    </div>

    <!-- Edit profile modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="editModal.open"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          @click.self="editModal.open = false"
        >
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-5">
              <h3 class="font-semibold text-gray-900 text-lg">Chỉnh sửa thông tin</h3>
              <button
                class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                @click="editModal.open = false"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Họ tên</label>
                <input v-model="editModal.display_name" type="text" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Avatar URL</label>
                <input v-model="editModal.avatar_url" type="url" placeholder="https://..." class="input-field" />
              </div>
            </div>
            <div class="flex gap-3 mt-6 justify-end">
              <button class="btn-secondary" :disabled="editModal.loading" @click="editModal.open = false">
                Hủy
              </button>
              <button class="btn-primary" :disabled="editModal.loading" @click="saveProfile">
                <Save class="w-4 h-4" />
                {{ editModal.loading ? 'Đang lưu...' : 'Lưu thay đổi' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

