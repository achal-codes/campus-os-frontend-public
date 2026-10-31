import { defineTrack } from '@/core/tracks'
import { routes } from './routes'

export default defineTrack({
  id: 'docdesk',
  title: 'DocDesk',
  description: 'Digital document request and management system for educational institutions.',
  team: 'Team 24',
  icon: 'DD',
  navLabel: 'DocDesk',
  routes,
})
