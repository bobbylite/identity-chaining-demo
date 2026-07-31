import { useCallback, useEffect, useState } from 'react'

export type ThemeChoice = 'system' | 'light' | 'dark'

const KEY = 'xdomain-theme'

function read(): ThemeChoice {
  if (typeof localStorage === 'undefined') return 'system'
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

function systemPrefersDark(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Theme is applied as `data-theme="light" | "dark"` on <html>. "system" keeps
 * following the OS while the page is open, so flipping the OS theme flips the page.
 */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(read)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    if (typeof matchMedia === 'undefined') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' =
    choice === 'system' ? (systemDark ? 'dark' : 'light') : choice

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
  }, [resolved])

  const set = useCallback((next: ThemeChoice) => {
    setChoice(next)
    if (next === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  }, [])

  return { choice, resolved, setTheme: set }
}
