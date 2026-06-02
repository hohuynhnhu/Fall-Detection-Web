<script setup lang="ts">
import { Send, Users, User, Mail } from 'lucide-vue-next'

const { apiFetch } = useApi()
const toast = useToast()

const targetAll = ref(true)
const userEmail = ref('')
const title = ref('')
const message = ref('')
const loading = ref(false)

const canSubmit = computed(() =>
  title.value.trim() && message.value.trim() && (targetAll.value || userEmail.value.trim())
)

const submit = async () => {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await apiFetch('/admin/notifications/send-email', {
      method: 'POST',
      body: {
        email: targetAll.value ? null : userEmail.value.trim(),
        title: title.value.trim(),
        message: message.value.trim()
      }
    })
    toast.add('success', targetAll.value ? 'Đã gửi email đến tất cả người dùng' : 'Đã gửi email đến người dùng')
    title.value = ''
    message.value = ''
    userEmail.value = ''
  } catch {
    toast.add('error', 'Không thể gửi email thông báo')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-2xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Gửi thông báo</h1>
      <p class="text-gray-500 text-sm mt-0.5">Gửi email thông báo đến người dùng qua Gmail</p>
    </div>

    <div class="card p-6 space-y-5">
      <!-- Target selector -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Đối tượng nhận</label>
        <div class="grid grid-cols-2 gap-3">
          <button
            :class="[
              'flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-medium transition-colors text-left',
              targetAll
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            ]"
            @click="targetAll = true"
          >
            <div :class="['p-2 rounded-lg', targetAll ? 'bg-indigo-100' : 'bg-gray-100']">
              <Users :class="['w-5 h-5', targetAll ? 'text-indigo-600' : 'text-gray-500']" />
            </div>
            <div>
              <p>Tất cả người dùng</p>
              <p class="text-xs font-normal opacity-70 mt-0.5">Gửi email cho toàn bộ</p>
            </div>
          </button>
          <button
            :class="[
              'flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-medium transition-colors text-left',
              !targetAll
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            ]"
            @click="targetAll = false"
          >
            <div :class="['p-2 rounded-lg', !targetAll ? 'bg-indigo-100' : 'bg-gray-100']">
              <User :class="['w-5 h-5', !targetAll ? 'text-indigo-600' : 'text-gray-500']" />
            </div>
            <div>
              <p>Một người dùng</p>
              <p class="text-xs font-normal opacity-70 mt-0.5">Chỉ định địa chỉ email</p>
            </div>
          </button>
        </div>
      </div>

      <!-- User ID input (only when targeting specific user) -->
      <Transition name="slide">
        <div v-if="!targetAll">
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email người dùng</label>
          <input
            v-model="userEmail"
            type="email"
            placeholder="Nhập địa chỉ email..."
            class="input-field"
          />
        </div>
      </Transition>

      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề thông báo</label>
        <input
          v-model="title"
          type="text"
          placeholder="Nhập tiêu đề..."
          class="input-field"
          maxlength="100"
        />
        <p class="text-xs text-gray-400 mt-1 text-right">{{ title.length }}/100</p>
      </div>

      <!-- Message -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Nội dung thông báo</label>
        <textarea
          v-model="message"
          rows="4"
          placeholder="Nhập nội dung thông báo..."
          class="input-field resize-none"
          maxlength="500"
        />
        <p class="text-xs text-gray-400 mt-1 text-right">{{ message.length }}/500</p>
      </div>

      <!-- Preview -->
      <div v-if="title || message" class="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p class="text-xs text-blue-400 mb-2 font-medium uppercase tracking-wide">Xem trước email</p>
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
            <Mail class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-blue-400 mb-1">
              Đến: <span class="font-medium text-blue-600">{{ targetAll ? 'Tất cả người dùng' : (userEmail || '(chưa nhập email)') }}</span>
            </p>
            <p class="font-semibold text-gray-900 text-sm">{{ title || '(Tiêu đề)' }}</p>
            <p class="text-gray-600 text-sm mt-0.5 whitespace-pre-wrap">{{ message || '(Nội dung)' }}</p>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end pt-2">
        <button
          :disabled="!canSubmit || loading"
          class="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="submit"
        >
          <Mail class="w-4 h-4" />
          <span v-if="loading">Đang gửi...</span>
          <span v-else>{{ targetAll ? 'Gửi email cho tất cả' : 'Gửi email' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.slide-enter-to,
.slide-leave-from {
  max-height: 100px;
}
</style>
