<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{ 'update:page': [page: number] }>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const pages = computed(() => {
  const p = props.page
  const last = totalPages.value
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)

  const range: (number | '...')[] = [1]
  if (p > 3) range.push('...')
  for (let i = Math.max(2, p - 1); i <= Math.min(last - 1, p + 1); i++) range.push(i)
  if (p < last - 2) range.push('...')
  range.push(last)
  return range
})
</script>

<template>
  <div v-if="total > 0" class="flex items-center justify-between gap-4 pt-4">
    <p class="text-sm text-gray-500">
      Hiển thị {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, total) }}
      trong tổng số <span class="font-medium text-gray-700">{{ total }}</span> bản ghi
    </p>
    <div class="flex items-center gap-1">
      <button
        class="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      <template v-for="p in pages" :key="p">
        <span v-if="p === '...'" class="px-2 text-gray-400 text-sm">…</span>
        <button
          v-else
          :class="[
            'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
            p === page
              ? 'bg-indigo-600 text-white'
              : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
          ]"
          @click="emit('update:page', p)"
        >
          {{ p }}
        </button>
      </template>
      <button
        class="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        :disabled="page >= totalPages"
        @click="emit('update:page', page + 1)"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
