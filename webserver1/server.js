const express = require("express");
const redis = require("redis");
const path = require("path");

const app = express();
const PORT = 8080;

const client = redis.createClient({
  url: 'redis://redis:6379'
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

const retryRedisConnection = async () => {
  try {
    await client.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Redis connection failed. Retrying...', err);
    setTimeout(retryRedisConnection, 5000);
  }
};

retryRedisConnection();

app.use(async (req, res, next) => {
  try {
    const webserver1Count = await client.incr('webserver1_count');
    const totalVisits = await client.incr('total_visits');
    
    res.locals.webserver1Count = webserver1Count;
    res.locals.totalVisits = totalVisits;
    next();
  } catch (err) {
    console.error("Error incrementing Redis keys:", err);
    next(err);
  }
});

app.use('/static', express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  const greeting = `Webserver 1 is running on http://localhost:${PORT}`;
  res.send(`
    <h1>${greeting}</h1>
    <p>You have visited webserver1: ${res.locals.webserver1Count} times.</p>
    <p>You have visited both webservers: ${res.locals.totalVisits} times.</p>
  `);
});

app.listen(PORT, () => {
  console.log(`Webserver 1 is running on http://localhost:${PORT}`);
});
