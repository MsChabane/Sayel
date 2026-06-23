'use client'

import { Moon, Sun } from "lucide-react"
import { useTheme } from 'next-themes'

export const ThemeToggle=()=>{

    const { theme, setTheme } = useTheme()
    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800
                       transition-colors"
          >
            {theme === 'dark'
              ? <Sun className="w-5 h-5 text-yellow-500" />
              : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
    )
}