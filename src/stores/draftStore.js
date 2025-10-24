import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Простая persisted store для множества черновиков (localStorage)
// API: setDraft(id, data), updateDraft(id, patch), deleteDraft(id), listDrafts()
const useDraftStore = create(persist((set, get) => ({
  drafts: {},

  setDraft: (id, data) => set(state => ({ drafts: { ...state.drafts, [id]: data } })),

  updateDraft: (id, patch) => set(state => ({
    drafts: {
      ...state.drafts,
      [id]: { ...(state.drafts[id] || {}), ...patch }
    }
  })),

  deleteDraft: (id) => set(state => {
    const copy = { ...state.drafts }
    delete copy[id]
    return { drafts: copy }
  }),

  listDrafts: () => {
    const d = get().drafts
    return Object.entries(d).map(([id, payload]) => ({ id, ...payload }))
  }
}), {
  name: 'post-drafts' // ключ в localStorage
}))

export default useDraftStore