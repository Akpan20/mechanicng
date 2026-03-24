import { useDispatch, useSelector } from 'react-redux'
import { setTheme } from '@/store/themeSlice'

export default function ThemeToggle() {
  const dispatch = useDispatch()
  const mode = useSelector((state: any) => state.theme.mode)

  const base = "px-3 py-1 rounded-md text-sm transition"

  const active = "bg-orange-500 text-white"
  const inactive = "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"

  return (
    <div className="flex gap-2">
      <button
        onClick={() => dispatch(setTheme('light'))}
        className={`${base} ${mode === 'light' ? active : inactive}`}
      >
        Light
      </button>

      <button
        onClick={() => dispatch(setTheme('dark'))}
        className={`${base} ${mode === 'dark' ? active : inactive}`}
      >
        Dark
      </button>

      <button
        onClick={() => dispatch(setTheme('system'))}
        className={`${base} ${mode === 'system' ? active : inactive}`}
      >
        System
      </button>
    </div>
  )
}