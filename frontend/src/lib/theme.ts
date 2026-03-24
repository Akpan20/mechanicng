export const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const resolveTheme = (mode: 'light' | 'dark' | 'system') => {
  return mode === 'system' ? getSystemTheme() : mode
}