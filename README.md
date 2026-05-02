This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## API Endpoints

All API routes expect an `x-user-id` header. The backend opens a DB transaction, sets `request.jwt.claim.sub`, and relies on your existing RLS policies.

- `GET /api/diaries` — list a user's sleep diaries
- `POST /api/diaries` — create a 14-day AASM-style diary from `{ "startDate": "YYYY-MM-DD" }`
- `GET /api/diaries/[diaryId]` — fetch a diary with weeks, days, timeline items, and stored metrics
- `PATCH /api/diaries/[diaryId]/days/[dayId]` — update `dayKind` and/or `notes`
- `GET /api/diaries/[diaryId]/timeline-items` — list sleep/substance/bedtime timeline entries
- `POST /api/diaries/[diaryId]/timeline-items` — create a point event or interval event with Zod validation
- `PATCH /api/diaries/[diaryId]/timeline-items/[itemId]` — update a timeline item
- `DELETE /api/diaries/[diaryId]/timeline-items/[itemId]` — delete a timeline item
- `GET /api/diaries/[diaryId]/metrics` — recalculate and return weekly averages
- `POST /api/diaries/[diaryId]/metrics` — same as GET, useful for explicit refresh flows

Supported timeline item types:
`sleep`, `nap`, `awake`, `in_bed`, `exercise`, `caffeine`, `alcohol`, `medicine`, `bedtime_marker`, `wake_marker`, `note`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
