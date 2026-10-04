const express = require("express");
const redis = require("redis");

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost";
const KEY_PREFIX = "views:";
const OBJECT_ID = /^[0-9a-f]{24}$/;

const redisClient = redis.createClient({
  url: REDIS_URL,
});

const app = express();

app.get("/counter/:bookId", async (req, res) => {
  const { bookId } = req.params;

  if (!OBJECT_ID.test(bookId)) {
    return res.status(400).json({ error: "Invalid bookId" });
  }

  const count = (await redisClient.get(`${KEY_PREFIX}${bookId}`)) || 1;
  res.json({ bookId, count });
});

app.post("/counter/:bookId/incr", async (req, res) => {
  const { bookId } = req.params;

  if (!OBJECT_ID.test(bookId)) {
    return res.status(400).json({ error: "Invalid bookId" });
  }

  const count = await redisClient.incr(`${KEY_PREFIX}${bookId}`);
  res.json({ status: "ok", count });
});

if (require.main === module) {
  (async () => {
    await redisClient.connect();
  })();

  app.listen(PORT, () => {
    console.log(`Counter service listening on port ${PORT}`);
  });
}

module.exports = { app, redisClient, KEY_PREFIX, OBJECT_ID };
