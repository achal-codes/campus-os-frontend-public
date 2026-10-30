import type { RouteObject } from 'react-router'
import { AdminGuard, RequesterGuard, StudentAffairsGuard } from './components/Guards'

export const routes: RouteObject[] = [
  // Requester routes (students, faculty, office_staff)
  {
    index: true,
    lazy: async () => {
      const { RequesterDashboardScreen } = await import('./screens/RequesterDashboardScreen')
      return {
        Component: () => (
          <RequesterGuard>
            <RequesterDashboardScreen />
          </RequesterGuard>
        ),
      }
    },
  },
  {
    path: 'catalogue',
    lazy: async () => {
      const { DocumentCatalogueScreen } = await import('./screens/DocumentCatalogueScreen')
      return {
        Component: () => (
          <RequesterGuard>
            <DocumentCatalogueScreen />
          </RequesterGuard>
        ),
      }
    },
  },
  {
    path: 'new',
    lazy: async () => {
      const { RequestFormScreen } = await import('./screens/RequestFormScreen')
      return {
        Component: () => (
          <RequesterGuard>
            <RequestFormScreen />
          </RequesterGuard>
        ),
      }
    },
  },
  {
    path: 'scholarship',
    lazy: async () => {
      const { ScholarshipRequestScreen } = await import('./screens/ScholarshipRequestScreen')
      return {
        Component: () => (
          <RequesterGuard>
            <ScholarshipRequestScreen />
          </RequesterGuard>
        ),
      }
    },
  },
  {
    path: 'my-requests',
    lazy: async () => {
      const { MyRequestsScreen } = await import('./screens/MyRequestsScreen')
      return {
        Component: () => (
          <RequesterGuard>
            <MyRequestsScreen />
          </RequesterGuard>
        ),
      }
    },
  },
  {
    path: 'requests/:id',
    lazy: async () => {
      const { RequestDetailScreen } = await import('./screens/RequestDetailScreen')
      return {
        Component: () => (
          <RequesterGuard>
            <RequestDetailScreen />
          </RequesterGuard>
        ),
      }
    },
  },

  // Student Affairs workspace
  {
    path: 'staff/dashboard',
    lazy: async () => {
      const { StaffDashboardScreen } = await import('./screens/StaffDashboardScreen')
      return {
        Component: () => (
          <StudentAffairsGuard>
            <StaffDashboardScreen />
          </StudentAffairsGuard>
        ),
      }
    },
  },
  {
    path: 'staff',
    lazy: async () => {
      const { StaffQueueScreen } = await import('./screens/StaffQueueScreen')
      return {
        Component: () => (
          <StudentAffairsGuard>
            <StaffQueueScreen />
          </StudentAffairsGuard>
        ),
      }
    },
  },
  {
    path: 'staff/bulk-tat',
    lazy: async () => {
      const { BulkTATScreen } = await import('./screens/BulkTATScreen')
      return {
        Component: () => (
          <StudentAffairsGuard>
            <BulkTATScreen />
          </StudentAffairsGuard>
        ),
      }
    },
  },
  {
    path: 'staff/requests/:id',
    lazy: async () => {
      const { StaffDetailScreen } = await import('./screens/StaffDetailScreen')
      return {
        Component: () => (
          <StudentAffairsGuard>
            <StaffDetailScreen />
          </StudentAffairsGuard>
        ),
      }
    },
  },
  {
    path: 'staff/doc-types',
    lazy: async () => {
      const { DocTypeManagerScreen } = await import('./screens/DocTypeManagerScreen')
      return {
        Component: () => (
          <StudentAffairsGuard>
            <DocTypeManagerScreen />
          </StudentAffairsGuard>
        ),
      }
    },
  },

  // Admin read-only inspection
  {
    path: 'admin',
    lazy: async () => {
      const { AdminOverviewScreen } = await import('./screens/AdminOverviewScreen')
      return {
        Component: () => (
          <AdminGuard>
            <AdminOverviewScreen />
          </AdminGuard>
        ),
      }
    },
  },
  {
    path: 'admin/requests/:id',
    lazy: async () => {
      const { AdminDetailScreen } = await import('./screens/AdminDetailScreen')
      return {
        Component: () => (
          <AdminGuard>
            <AdminDetailScreen />
          </AdminGuard>
        ),
      }
    },
  },
]
