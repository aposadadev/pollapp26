import { defineStore } from 'pinia'

interface BoardSummary {
  id: string
  number: number
  totalPoints: number
  currentPos: number
}

interface GroupContextState {
  groupId: string | null
  groupName: string | null
  groupCode: string | null
  boardId: string | null
  boards: BoardSummary[]
}

const STORAGE_KEY = 'polla_ctx'

function loadFromStorage(): Partial<GroupContextState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<GroupContextState>
  } catch {
    return {}
  }
}

function saveToStorage(state: GroupContextState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* noop */ }
}

export const useGroupContextStore = defineStore('groupContext', {
  state: (): GroupContextState => ({
    groupId: null,
    groupName: null,
    groupCode: null,
    boardId: null,
    boards: [],
    ...loadFromStorage()
  }),

  getters: {
    hasContext: (state): boolean => !!state.groupId && !!state.boardId,
    activeBoardId: (state): string | null => state.boardId,
    activeGroupId: (state): string | null => state.groupId,
    activeGroupName: (state): string | null => state.groupName,
    activeGroupCode: (state): string | null => state.groupCode,
    hasMultipleBoards: (state): boolean => state.boards.length > 1
  },

  actions: {
    setContext(params: {
      groupId: string
      groupName: string
      groupCode: string
      boardId: string
      boards?: BoardSummary[]
    }) {
      this.groupId = params.groupId
      this.groupName = params.groupName
      this.groupCode = params.groupCode
      this.boardId = params.boardId
      this.boards = params.boards ?? []
      saveToStorage(this.$state)
    },

    switchBoard(boardId: string) {
      this.boardId = boardId
      saveToStorage(this.$state)
    },

    /** Llamar desde auth.store al hacer logout */
    clearContext() {
      this.groupId = null
      this.groupName = null
      this.groupCode = null
      this.boardId = null
      this.boards = []
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }
})
