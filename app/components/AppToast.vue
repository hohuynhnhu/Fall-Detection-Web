<script setup lang="ts">
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-vue-next'

const { toasts, remove } = useToast()

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
}

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['flex items-start gap-3 p-4 rounded-xl border shadow-lg', colors[toast.type]]"
        >
          <component
            :is="icons[toast.type]"
            :class="['w-5 h-5 shrink-0 mt-0.5', iconColors[toast.type]]"
          />
          <p class="flex-1 text-sm font-medium leading-tight">{{ toast.message }}</p>
          <button
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            @click="remove(toast.id)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
