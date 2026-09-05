import { useEffect, useState } from 'react'
import type { AppData } from './domain'
import { demoData } from './domain'

const storageKey = 'shree-balaje-brokerage-data-v1'

function loadData(): AppData {
  try {
    const saved = window.localStorage.getItem(storageKey)
    const parsed = saved ? JSON.parse(saved) as Partial<AppData> : demoData
    return { ...demoData, ...parsed, dealTrips: parsed.dealTrips ?? [], obligations: parsed.obligations ?? [] }
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
