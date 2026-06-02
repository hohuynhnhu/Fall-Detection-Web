<script setup lang="ts">
import { Bar } from 'vue-chartjs'

const props = defineProps<{
  data: Array<{ date: string; count: number }>
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.date),
  datasets: [{
    label: 'Số vụ té ngã',
    data: props.data.map(d => d.count),
    backgroundColor: 'rgba(99,102,241,0.8)',
    borderColor: '#6366f1',
    borderWidth: 0,
    borderRadius: 5
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#f9fafb',
      bodyColor: '#d1d5db',
      padding: 10,
      cornerRadius: 8
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
    y: {
      beginAtZero: true,
      ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 1 },
      grid: { color: '#f3f4f6' }
    }
  }
}
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
