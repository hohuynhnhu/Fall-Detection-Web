<script setup lang="ts">
defineProps<{
  label: string
  value?: string
}>()
</script>

<template>
  <div class="flex justify-between items-center text-sm">
    <span class="text-gray-500 flex items-center gap-1">
      <slot />
      {{ label }}
    </span>
    <span class="font-medium text-gray-700 truncate ml-2 max-w-[55%]">{{ value || '—' }}</span>
  </div>
</template>
