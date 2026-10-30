import type { RouteObject } from 'react-router'
import { NoticeBoardScreen } from './screens/NoticeBoardScreen'
import { NoticeDetailScreen } from './screens/NoticeDetailScreen'
import { ComposeNoticeScreen } from './screens/ComposeNoticeScreen'

export const routes: RouteObject[] = [
  {
    index: true,
    element: <NoticeBoardScreen />,
  },
  {
    path: 'compose',
    element: <ComposeNoticeScreen />,
  },
  {
    path: ':id',
    element: <NoticeDetailScreen />,
  },
]
