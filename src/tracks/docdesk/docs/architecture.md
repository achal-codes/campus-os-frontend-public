# DocDesk Architecture

## Overview
DocDesk is structured as a track inside the Campus OS frontend architecture, adhering to track boundaries and rules:
- Mounted at `/tracks/docdesk`
- Auto-discovered via `defineTrack()` in `src/tracks/docdesk/index.ts`
- Uses shared UI primitives from `@/ui` and tokens from `@/theme`
- Uses shared API client from `@/core/api` for standard JSON operations
- Uses track-local adapter `api/http.ts` for authenticated multipart upload and binary blob downloads
- All routes are lazily loaded to preserve bundle efficiency

## Layering
```
src/tracks/docdesk/
├── api/            # Typed endpoints and HTTP transport adapter
├── components/     # Shared presentation components (StatusBadge, Timeline, CommunicationPanel)
├── docs/           # Architecture, API matrices, quirks, testing reports
├── hooks/          # useProfile, useCursorPagination
├── permissions/    # Central typed permission engine (can())
├── routes.tsx      # Route definitions with track-local guards
├── screens/        # Screen components (Requester, Staff, Admin)
├── types/          # Strict TypeScript interfaces
└── utils/          # Department normalisation, time (IST), errors, file validation
```
