import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const app = createApp();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
