<script setup lang="ts">
import { Bar } from 'vue-chartjs'

const props = defineProps<{
  data: Array<[string, number]>
}>()

const chartData = computed(() => ({
  labels: props.data.map(([cam]) => cam),
  datasets: [{
    label: 'Số vụ',
    data: props.data.map(([, count]) => count),
    backgroundColor: 'rgba(14,165,233,0.8)',
    borderColor: '#0ea5e9',
    borderWidth: 0,
    borderRadius: 4
  }]
}))

const chartOptions = {
  indexAxis: 'y' as const,
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
    x: {
      beginAtZero: true,
      ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 1 },
      grid: { color: '#f3f4f6' }
    },
    y: { grid: { display: false }, ticks: { color: '#374151', font: { size: 11 } } }
  }
}
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
