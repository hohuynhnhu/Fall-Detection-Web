<script setup lang="ts">
const props = defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClass = computed(() => ({
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-8 h-8'
}[props.size ?? 'md']))
</script>

<template>
  <svg :class="[sizeClass, 'animate-spin text-indigo-400']" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
</template>
