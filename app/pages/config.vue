<script setup lang="ts">
import { Settings, RefreshCw, Save, RotateCcw, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-vue-next'

const { apiFetch } = useApi()
const toast = useToast()

const cameraId = ref('cam_0')

// Thresholds
const thresholds = ref<Record<string, any>>({})
const thresholdsLoading = ref(true)
const thresholdsSaving = ref(false)
const thresholdsResetting = ref(false)
const thresholdsForm = ref<Record<string, number>>({})

// Features
const features = ref<Record<string, boolean>>({})
const featuresLoading = ref(true)
const featuresSaving = ref(false)

const fetchThresholds = async () => {
  thresholdsLoading.value = true
  try {
    const data = await apiFetch<any>('/config/thresholds', { params: { camera_id: cameraId.value } })
    thresholds.value = data
    thresholdsForm.value = { ...data }
  } catch {
    toast.add('error', 'Không thể tải cấu hình ngưỡng')
  } finally {
    thresholdsLoading.value = false
  }
}

const fetchFeatures = async () => {
  featuresLoading.value = true
  try {
    const data = await apiFetch<any>('/config/features', { params: { camera_id: cameraId.value } })
    features.value = { ...data }
  } catch {
    toast.add('error', 'Không thể tải cấu hình tính năng')
  } finally {
    featuresLoading.value = false
  }
}

const applyThresholds = async () => {
  thresholdsSaving.value = true
  try {
    await apiFetch('/config/thresholds', {
      method: 'PATCH',
      body: { camera_id: cameraId.value, ...thresholdsForm.value }
    })
    toast.add('success', 'Đã áp dụng cấu hình ngưỡng thành công')
    await fetchThresholds()
  } catch {
    toast.add('error', 'Không thể áp dụng cấu hình ngưỡng')
  } finally {
    thresholdsSaving.value = false
  }
}

const resetThresholds = async () => {
  thresholdsResetting.value = true
  try {
    await apiFetch('/config/thresholds/reset', {
      method: 'POST',
      body: { camera_id: cameraId.value }
    })
    toast.add('success', 'Đã khôi phục cấu hình ngưỡng mặc định')
    await fetchThresholds()
  } catch {
    toast.add('error', 'Không thể khôi phục cấu hình')
  } finally {
    thresholdsResetting.value = false
  }
}

const saveFeatures = async () => {
  featuresSaving.value = true
  try {
    await apiFetch('/config/features', {
      method: 'PATCH',
      body: { camera_id: cameraId.value, ...features.value }
    })
    toast.add('success', 'Đã lưu cấu hình tính năng')
  } catch {
    toast.add('error', 'Không thể lưu cấu hình tính năng')
  } finally {
    featuresSaving.value = false
  }
}

const toggleFeature = (key: string) => {
  features.value[key] = !features.value[key]
}

watch(cameraId, async () => {
  await Promise.all([fetchThresholds(), fetchFeatures()])
})

onMounted(async () => {
  await Promise.all([fetchThresholds(), fetchFeatures()])
})

const formatKey = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Cấu hình hệ thống</h1>
        <p class="text-gray-500 text-sm mt-0.5">Quản lý ngưỡng phát hiện và tính năng</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">Camera:</label>
        <div class="relative">
          <select v-model="cameraId" class="input-field w-36 pr-8 appearance-none">
            <option value="cam_0">cam_0</option>
            <option value="cam_1">cam_1</option>
            <option value="cam_2">cam_2</option>
          </select>
          <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>

    Thresholds
    

    <!-- Features -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <ToggleRight class="w-5 h-5 text-indigo-500" />
          <h2 class="font-semibold text-gray-900">Tính năng hệ thống</h2>
        </div>
        <button
          class="btn-secondary text-xs"
          @click="fetchFeatures"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          Tải lại
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="featuresLoading" class="space-y-4">
        <div v-for="i in 4" :key="i" class="animate-pulse flex items-center justify-between">
          <div class="h-4 bg-gray-200 rounded w-1/3" />
          <div class="h-6 w-11 bg-gray-100 rounded-full" />
        </div>
      </div>

      <div v-else class="divide-y divide-gray-50">
        <div
          v-for="(enabled, key) in features"
          :key="key"
          class="flex items-center justify-between py-3.5"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ formatKey(String(key)) }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ enabled ? 'Đang bật' : 'Đang tắt' }}</p>
          </div>
          <button
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
              enabled ? 'bg-indigo-600' : 'bg-gray-200'
            ]"
            @click="toggleFeature(String(key))"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                enabled ? 'translate-x-6' : 'translate-x-1'
              ]"
            />
          </button>
        </div>
      </div>

      <div v-if="!featuresLoading" class="flex mt-6 pt-5 border-t border-gray-100">
        <button
          class="btn-primary"
          :disabled="featuresSaving"
          @click="saveFeatures"
        >
          <Save class="w-4 h-4" />
          {{ featuresSaving ? 'Đang lưu...' : 'Lưu cấu hình' }}
        </button>
      </div>
    </div>
  </div>
</template>
