import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('theme') as ThemeMode | null
  return saved || 'system'
}

const initialState: ThemeState = {
  mode: getInitialTheme(),
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload
      localStorage.setItem('theme', action.payload)
    },
  },
})

export const { setTheme } = themeSlice.actions
export default themeSlice.reducer