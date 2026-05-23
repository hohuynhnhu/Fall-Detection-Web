<script setup lang="ts">
import { Eye, EyeOff, ShieldCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

const { setToken, user } = useAuth()
const { apiFetch } = useApi()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

const login = async () => {
  if (!email.value || !password.value) return
  loading.value = true
  error.value = ''

  try {
    const data = await apiFetch<any>('/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })

    if (data?.user?.role !== 'admin') {
      error.value = 'Tài khoản này không có quyền truy cập Admin Panel.'
      return
    }

    setToken(data.id_token)
    user.value = data.user
    await router.push('/')
  } catch (err: any) {
    const msg = err?.data?.detail || err?.data?.message || err?.message
    error.value = msg || 'Sai email hoặc mật khẩu. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md">
    <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck class="w-8 h-8 text-indigo-600" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Fall Guard Admin</h1>
        <p class="text-gray-500 text-sm mt-1.5">Đăng nhập để quản lý hệ thống</p>
      </div>

      <!-- Form -->
      <form class="space-y-5" @submit.prevent="login">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="input-field"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              class="input-field pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Error -->
        <Transition name="slide">
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          >
            {{ error }}
          </div>
        </Transition>

        <button type="submit" class="btn-primary w-full justify-center py-2.5 text-base" :disabled="loading">
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
