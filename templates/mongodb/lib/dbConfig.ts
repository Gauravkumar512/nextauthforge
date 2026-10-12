import mongoose from "mongoose";
import { getEnv } from "./env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache on globalThis so hot reloads in dev don't open a new connection each time.
const globalWithMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
};

const cache: MongooseCache = (globalWithMongoose._mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(getEnv().DATABASE_URL, { bufferCommands: false })
      .then((m) => {
        console.log("DB connected");
        return m;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Allow the next request to retry instead of caching the failure.
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
