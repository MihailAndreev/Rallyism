# Rallyism Next.js App

* Rallyism is a personal rally memories gallery app for organizing rally events, albums, photos and YouTube video links.
* Registered users can view rally memories and manage their own profile.
* Admin users can create, edit and delete rally events, albums, photos, videos, tags and users.
* Photos are stored in Cloudflare R2; the database stores image metadata, public URLs and R2 object keys.
* Videos are stored as YouTube links, not uploaded files.
* The app supports simple media filtering: All / Photos / Videos.

# Technologies

* Next.js + Neon DB + Drizzle ORM + React + Tailwind
* TypeScript
* PostgreSQL database hosted in Neon
* Drizzle Kit migrations for all database schema changes
* Cloudflare R2 for photo storage
* YouTube links for video content
* Back-end API source code: `..\rallyism-web\src\app\api`

# Architectural Guidelines

* Use a **client-server architecture**:

  * Next.js Web app communicates with the backend through Server Actions.
  * RESTful API endpoints expose backend functionality for possible mobile app usage.
* **Service layer**:

  * Implement all main business logic in services.
  * Services are used by both Server Actions and RESTful API route handlers.
  * Avoid duplicating business logic inside UI components or API endpoints.
* Use **modular design**:

  * Split the app into self-contained components and modules.
  * Keep separate files for UI components, services, database access, validation, auth, storage and utilities.
  * Avoid large files with too much mixed logic.
* **Auth**:

  * Use JWT tokens for authentication.
  * Store passwords securely using bcrypt.
  * Use cookies for Web sessions and Bearer tokens for RESTful API access.
  * Prepare for forgot-password functionality.
* **Authorization**:

  * Enforce role-based access checks.
  * Admin users manage rally events, albums, media items, tags and users.
  * Regular users can view allowed content and manage their own profile.
* **Database**:

  * Use Neon DB + Drizzle ORM.
  * Always use Drizzle migrations for schema changes / store migrations locally.
  * Use indexes and server-side paging for lists with many rally events, albums, photos, videos, tags or users.
* **Storage**:

  * Use Cloudflare R2 only on the server side.
  * Never expose R2 credentials to client components.
  * Store only public URLs, object keys and image metadata in the database.

# User Interface Guidelines

* Implement a modern, clean and responsive gallery-focused UI.
* Use Next.js App Router and server-rendered components by default.
* Use server-side rendering for pages that load rally events, albums and media items from the database.
* Use client components only when browser interaction is needed, for example:

  * login / register forms
  * upload forms
  * media filters
  * gallery viewer
  * delete confirmations
  * modals, dropdowns and dynamic UI controls
* Split the UI into reusable components:

  * layout components
  * rally event cards
  * album cards
  * media grid
  * photo viewer
  * video link cards
  * upload forms
  * filter controls
  * buttons and badges
* Use visual handling suitable for different photo formats:

  * thumbnail grid may use cropped previews
  * full viewer must show the whole photo
  * support common formats such as 16:9 and 4:3
* Design mobile-first and ensure the app works well on desktop and mobile browsers.
