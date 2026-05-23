export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxt/a11y', '@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000'
    }
  },
  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  }
})
