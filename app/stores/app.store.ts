import { defineStore } from 'pinia'

interface AppState {
  pageTitle: string
  showBottomNav: boolean
  isLoading: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    pageTitle: 'Mundial 2026',
    showBottomNav: true,
    isLoading: false
  }),

  actions: {
    setPageTitle(title: string) {
      this.pageTitle = title
    },
    setShowBottomNav(show: boolean) {
      this.showBottomNav = show
    },
    setLoading(loading: boolean) {
      this.isLoading = loading
    }
  }
})
