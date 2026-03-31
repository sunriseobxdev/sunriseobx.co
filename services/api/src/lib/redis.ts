import { createClient } from "redis";

let client: ReturnType<typeof createClient> | null = null;
let connected = false;

export async function getRedis() {
  if (!client) {
    const host = process.env.REDIS_HOST || "localhost";
    const port = parseInt(process.env.REDIS_PORT || "6379", 10);
    client = createClient({
      socket: {
        host,
        port,
        connectTimeout: 3000,
        reconnectStrategy: (retries) =>
          retries > 3 ? false : Math.min(retries * 500, 2000),
      },
    });
    client.on("error", () => {
      connected = false;
    });
    client.on("connect", () => {
      connected = true;
    });
    try {
      await client.connect();
    } catch {
      connected = false;
    }
  }
  return connected ? client : null;
}
