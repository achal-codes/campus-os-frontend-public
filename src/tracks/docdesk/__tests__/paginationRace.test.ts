import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCursorPagination } from '../hooks/useCursorPagination'

describe('useCursorPagination (BUG-04 deduplication & pagination state)', () => {
  it('deduplicates appended items when overlapping IDs are returned by cursor', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({
        items: [{ request_id: 'REQ-1', title: 'First' }, { request_id: 'REQ-2', title: 'Second' }],
        next_cursor: 'cursor-token-1',
        count: 3,
      })
      .mockResolvedValueOnce({
        // REQ-2 is returned again in page 2 due to concurrent backend mutation
        items: [{ request_id: 'REQ-2', title: 'Second' }, { request_id: 'REQ-3', title: 'Third' }],
        next_cursor: null,
        count: 3,
      })

    const { result } = renderHook(() => useCursorPagination(fetcher))

    await act(async () => {
      await result.current.loadFirst()
    })

    expect(result.current.items).toHaveLength(2)
    expect(result.current.hasMore).toBe(true)

    await act(async () => {
      await result.current.loadMore()
    })

    // Should have 3 unique items, not 4
    expect(result.current.items).toHaveLength(3)
    expect(result.current.items.map((i: any) => i.request_id)).toEqual(['REQ-1', 'REQ-2', 'REQ-3'])
    expect(result.current.hasMore).toBe(false)
  })
})

