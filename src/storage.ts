import { useEffect, useState } from 'react'
import type { AppData } from './domain'
import { demoData } from './domain'

const storageKey = 'shree-balaje-brokerage-data-v1'

function loadData(): AppData {
  try {
    const saved = window.localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) as AppData : demoData
  } catch {
    return demoData
  }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(loadData)
  useEffect(() => window.localStorage.setItem(storageKey, JSON.stringify(data)), [data])
  return [data, setData] as const
}

export function resetLocalData() {
  window.localStorage.removeItem(storageKey)
}
