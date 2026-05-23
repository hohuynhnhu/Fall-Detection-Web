<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="emit('cancel')"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <div class="flex gap-4">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle class="w-5 h-5 text-red-600" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 text-lg">{{ title }}</h3>
              <p class="text-gray-500 text-sm mt-1">{{ message }}</p>
            </div>
          </div>
          <div class="flex gap-3 mt-6 justify-end">
            <button class="btn-secondary" :disabled="loading" @click="emit('cancel')">
              Hủy
            </button>
            <button class="btn-danger" :disabled="loading" @click="emit('confirm')">
              <span v-if="loading">Đang xử lý...</span>
              <span v-else>{{ confirmLabel || 'Xác nhận' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
