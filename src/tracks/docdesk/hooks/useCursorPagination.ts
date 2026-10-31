import { useCallback, useState } from 'react'
import type { PaginatedResponse } from '../types'

export interface PaginationState<T> {
  items: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  count: number
  loadFirst: () => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useCursorPagination<T>(
  fetcher: (cursor: string | null) => Promise<PaginatedResponse<T>>,
  deps: unknown[] = [],
): PaginationState<T> {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [initialized, setInitialized] = useState(false)

  const loadFirst = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher(null)
      setItems(res.items)
      setNextCursor(res.next_cursor)
      setCount(res.count)
      setInitialized(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher(nextCursor)
      setItems((prev) => {
        const getItemKey = (item: unknown) => {
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>
            if (typeof obj.request_id === 'string') return obj.request_id
            if (typeof obj.id === 'string') return obj.id
          }
          return JSON.stringify(item)
        }
        const seen = new Set(prev.map(getItemKey))
        return [...prev, ...res.items.filter((i) => !seen.has(getItemKey(i)))]
      })
      setNextCursor(res.next_cursor)
      setCount(res.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more data')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor, loading, ...deps])

  return {
    items,
    loading: loading && !initialized,
    error,
    hasMore: nextCursor !== null,
    count,
    loadFirst,
    loadMore,
    refresh: loadFirst,
  }
}
