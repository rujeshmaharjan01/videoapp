# VideoApp

A StreamTape-backed video hosting app built with Next.js 16, tRPC, Prisma, Better Auth, and the shadcn/base-ui component set. The project follows a feature-based layout similar to `code-with-antonio/nodebase`.

## Features

- Single seeded admin account (no public signup)
- Direct browser-to-StreamTape uploads with progress, so large files never pass through the app server
- Admin video library with search, pagination, folder filters, and storage stats
- Rename the display title, set visibility (public, unlisted, private), rename the underlying StreamTape file, move files between folders, and delete files
- Remote uploads: StreamTape downloads a video from a URL in the background
- Sync action that imports existing files from the account root and configured folder into the local library and refreshes names, sizes, thumbnails, and conversion statuses
- Public watch page at `/watch/[id]` with the StreamTape embed player
- View counting via StreamTape player.js `play` event with 40-second delay (matches StreamTape's own stat)
- Only READY videos appear in the public feed and watch pages
- StreamTape API credentials stay on the server. The browser only receives short-lived upload URLs

## Stack

- Next.js 16 (App Router, Turbopack)
- tRPC + TanStack Query
- Prisma 7 + PostgreSQL
- Better Auth
- nuqs, zod, base-ui/shadcn

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create `.env` with:

   ```dotenv
   DATABASE_URL=postgresql://user:password@localhost:5432/videoapp
   BETTER_AUTH_SECRET=replace-with-a-long-random-string
   BETTER_AUTH_URL=http://localhost:3000

   STREAMTAPE_LOGIN=your-streamtape-login
   STREAMTAPE_KEY=your-streamtape-api-key
   STREAMTAPE_FOLDER_ID=C_xxxxxxxxxxx
   ```

3. Apply the schema and generate the client:

   ```bash
   bunx prisma db push
   bunx prisma generate
   ```

4. Seed the admin account:

   ```bash
   bun run db:seed
   ```

5. Start the app:

   ```bash
   bun run dev
   ```

   Log in at `/login` with the seeded admin email, then use **Sync** to import files that already exist in the StreamTape account.

## How the library works

The dashboard reads from PostgreSQL instead of calling StreamTape on every request. StreamTape's API has strict rate limits, so listing the remote account on each page load is unreliable. Data flows in like this:

- **Upload** → the browser uploads directly to StreamTape, then `confirmUpload` stores the returned metadata with correct conversion status
- **Sync** → explicitly lists the account root and the current/configured folder, then upserts records and conversion statuses (batched for performance)
- **Remote upload** → starts on StreamTape; press **Sync** after it finishes to add it to the library
- **Watch page** → reads the local record and renders the StreamTape embed, with a StreamTape lookup fallback for unimported IDs
- **Views** → counted when the StreamTape player emits a `play` event, after a 40-second delay, once per tab per video

All StreamTape calls are serialized and cached in `src/lib/streamtape.ts`, with cache invalidation after mutations.

## Project structure

```text
src/
  app/
    (auth)/login
    (dashboard)/(rest)/videos
    watch/[id]
    api/auth/[...all], api/trpc/[trpc]
  components/
    app-sidebar.tsx, app-header.tsx, entity-components.tsx, ui/*
  features/
    auth/components/*
    videos/
      components/videos.tsx
      hooks/*
      server/{routers.ts,prefetch.ts,params-loader.ts}
      params.ts, types.ts
  lib/{auth.ts,auth-client.ts,prisma.ts,streamtape.ts,format.ts,toast.ts}
  trpc/{init.ts,server.tsx,client.tsx,query-client.ts,routers/_app.ts}
prisma/
  schema/{authschema.prisma,video.prisma}
```

## Scripts

```bash
bun run dev      # development server
bun run build    # production build
bun run start    # production server
bun run lint     # ESLint
bunx tsc --noEmit
bun run db:push  # push schema changes to database
bun run db:seed  # seed the admin account
bun run db:studio # open Prisma Studio
```

## Notes

- StreamTape file IDs are globally unique. A file can only belong to one local user record.
- `STREAMTAPE_FOLDER_ID` must be a folder ID (not a name); it is resolved on demand for uploads and sync.
- Existing lint errors in `src/components/ui/carousel.tsx` and `src/hooks/use-mobile.ts` come from the generated shadcn components.
- The view counter is per-tab and matches StreamTape's 40-second validation window; it is not StreamTape's dashboard number.