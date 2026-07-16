# Vexa Security Platform Dashboard

A React + Vite frontend for the Vexa attack surface management platform. Includes Firebase Auth, Firestore, MUI, shadcn/Radix UI components, Recharts, and React Router.

## Running the app

```
pnpm run dev
```

The dev server starts on port 5000.

## Environment variables

Firebase credentials are stored as Replit environment variables (`VITE_FIREBASE_*`). They are read at build time by Vite via `import.meta.env`. See `src/firebase.ts` for the full list of keys used.

## Stack

- **Framework**: React 18 + Vite 6
- **Styling**: Tailwind CSS v4, MUI, shadcn/Radix UI
- **Backend**: Firebase (Auth + Firestore)
- **Routing**: React Router v7
- **Charts**: Recharts

## Project structure

```
src/
  app/          # Pages and route components
  firebase.ts   # Firebase init, types, and Firestore helpers
  main.tsx      # App entry point
  styles/       # Global styles
public/         # Static assets
```

## User preferences

- Keep the existing project structure and stack intact.
