<script setup lang="ts">
import { Line } from 'vue-chartjs'

const props = defineProps<{
  data: Array<{ date: string; count: number }>
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.date),
  datasets: [
    {
      label: 'Số vụ té ngã',
      data: props.data.map(d => d.count),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
      pointHoverRadius: 6
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
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
    x: {
      grid: { display: false },
      ticks: { color: '#9ca3af', font: { size: 12 } }
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#9ca3af',
        font: { size: 12 },
        stepSize: 1
      },
      grid: { color: '#f3f4f6' }
    }
  }
}
</script>

<template>
  <Line :data="chartData" :options="chartOptions" />
</template>
