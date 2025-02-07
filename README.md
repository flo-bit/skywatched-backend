# skywatched jetstream

backend/appview for [skywatched](https://skywatched.app). runs on fly.io.

sqlite database with litefs for persistence.

## Development

```
npm i
npm run dev
```

if running with the frontend, change the backend url `BACKEND_URL` (in your `.env` file) in the frontend to `http://localhost:3001`.