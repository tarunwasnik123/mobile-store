# Mobile Store Backend (Express + MongoDB)

## Setup

1. Copy `.env.example` to `.env` and update `MONGO_URI`, `JWT_SECRET`, and admin credentials.
2. Install dependencies:
   npm install
3. Run the seed script to import frontend JSON into the DB:
   npm run seed
4. Start the server:
   npm run dev

## Notes
- Admin user is created from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars during seeding.
- API endpoints are exposed under `/api/*` and follow a simple REST pattern.
