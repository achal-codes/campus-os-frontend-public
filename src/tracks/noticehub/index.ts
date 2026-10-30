import { defineTrack } from '@/core/tracks'
import { routes } from './routes'

export default defineTrack({
  id: 'noticehub',
  title: 'Notice Hub',
  description: 'Official campus announcements, notices, and doubt inquiries.',
  team: 'Campus OS Core',
  icon: '📢',
  navLabel: 'Notice Hub',
  routes,
})
