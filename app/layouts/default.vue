<script setup lang="ts">
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  MessageSquare,
  Bell,
  AlertTriangle
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { user, clearAuth } = useAuth()
  
const sidebarOpen = ref(false)

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Quản lý người dùng', icon: Users },
  { href: '/falls', label: 'Lịch sử té ngã', icon: AlertTriangle },
  { href: '/reports', label: 'Báo cáo & Hỗ trợ', icon: MessageSquare },
  { href: '/notifications', label: 'Gửi thông báo', icon: Bell },
  { href: '/config', label: 'Cấu hình hệ thống', icon: Settings }
]

const isActive = (href: string) =>
  href === '/' ? route.path === '/' : route.path.startsWith(href)

const logout = () => {
  clearAuth()
  router.push('/login')
}

watch(() => route.path, () => { sidebarOpen.value = false })
</script>

<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/50 z-20 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 flex flex-col transition-transform duration-300 ease-in-out',
        'lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-gray-700/50">
        <div class="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck class="w-5 h-5 text-white" />
        </div>
        <div>
          <p class="text-white font-semibold text-sm leading-tight">Fall Guard</p>
          <p class="text-gray-400 text-xs">Admin Panel</p>
        </div>
        <button
          class="ml-auto lg:hidden text-gray-400 hover:text-white"
          @click="sidebarOpen = false"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.href"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(item.href)
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- User info at bottom -->
      <div class="px-3 py-4 border-t border-gray-700/50">
        <div class="flex items-center gap-3 px-3 py-2">
          <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
            <span class="text-white text-xs font-bold uppercase">
              {{ (user?.display_name || user?.email || 'A').charAt(0) }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-xs font-medium truncate">{{ user?.display_name || 'Admin' }}</p>
            <p class="text-gray-400 text-xs truncate">{{ user?.email }}</p>
          </div>
        </div>
        <button
          class="mt-1 flex items-center gap-3 w-full px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg text-sm transition-colors"
          @click="logout"
        >
          <LogOut class="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header class="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-3">
        <button
          class="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          @click="sidebarOpen = true"
        >
          <Menu class="w-5 h-5" />
        </button>
        <div class="flex-1" />
        <div class="flex items-center gap-2">
          <div class="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <div class="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
              <span class="text-indigo-600 text-xs font-bold uppercase">
                {{ (user?.display_name || user?.email || 'A').charAt(0) }}
              </span>
            </div>
            <span class="font-medium">{{ user?.display_name || user?.email }}</span>
          </div>
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            @click="logout"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>

    <!-- Toast notifications -->
    <AppToast />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
