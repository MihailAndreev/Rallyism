This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Cloudflare R2

Photo uploads are processed on the server with Sharp, then the generated WebP
display image and thumbnail are stored in Cloudflare R2. Configure these values
in `.env`:

```bash
R2_ENDPOINT="https://example-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="replace-with-r2-access-key-id"
R2_SECRET_ACCESS_KEY="replace-with-r2-secret-access-key"
R2_BUCKET_NAME="rallyism-media"
R2_PUBLIC_BASE_URL="https://media.example.com"
```

`R2_PUBLIC_BASE_URL` must be a public bucket URL or custom domain base URL. Do
not expose R2 access keys in client components or committed source files.

## Tests

Run the web unit test baseline with:

```bash
npm run test -w rallyism-web
```

The baseline uses Vitest and covers pure helper logic for YouTube URL parsing,
tag parsing and slugging, date formatting, auth validation, authorization
checks, photo upload validation and password reset token helpers. It does not
hit Neon, Cloudflare R2 or other network services.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
