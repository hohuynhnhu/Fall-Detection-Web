<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'

const props = defineProps<{
  high: number
  med: number
  low: number
}>()

const chartData = computed(() => ({
  labels: ['Cao (≥85%)', 'Trung bình (60–85%)', 'Thấp (<60%)'],
  datasets: [{
    data: [props.high, props.med, props.low],
    backgroundColor: ['rgba(239,68,68,0.85)', 'rgba(251,146,60,0.85)', 'rgba(250,204,21,0.85)'],
    borderColor: ['#ef4444', '#f97316', '#eab308'],
    borderWidth: 2,
    hoverOffset: 6
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#6b7280', font: { size: 11 }, padding: 14, boxWidth: 12 }
    },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#f9fafb',
      bodyColor: '#d1d5db',
      padding: 10,
      cornerRadius: 8
    }
  }
}
</script>

<template>
  <Doughnut :data="chartData" :options="chartOptions" />
</template>
