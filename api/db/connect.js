require('dotenv').config();
const { isEnabled } = require('@aladin/api');
const { logger } = require('@aladin/data-schemas');

const mongoose = require('mongoose');
let MONGO_URI = process.env.MONGO_URI;
let localMongo;
/** The maximum number of connections in the connection pool. */
const maxPoolSize = parseInt(process.env.MONGO_MAX_POOL_SIZE) || undefined;
/** The minimum number of connections in the connection pool. */
const minPoolSize = parseInt(process.env.MONGO_MIN_POOL_SIZE) || undefined;
/** The maximum number of connections that may be in the process of being established concurrently by the connection pool. */
const maxConnecting = parseInt(process.env.MONGO_MAX_CONNECTING) || undefined;
/** The maximum number of milliseconds that a connection can remain idle in the pool before being removed and closed. */
const maxIdleTimeMS = parseInt(process.env.MONGO_MAX_IDLE_TIME_MS) || undefined;
/** The maximum time in milliseconds that a thread can wait for a connection to become available. */
const waitQueueTimeoutMS = parseInt(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS) || undefined;
/** Set to false to disable automatic index creation for all models associated with this connection. */
const autoIndex =
  process.env.MONGO_AUTO_INDEX != undefined
    ? isEnabled(process.env.MONGO_AUTO_INDEX) || false
    : undefined;

/** Set to `false` to disable Mongoose automatically calling `createCollection()` on every model created on this connection. */
const autoCreate =
  process.env.MONGO_AUTO_CREATE != undefined
    ? isEnabled(process.env.MONGO_AUTO_CREATE) || false
    : undefined;
/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  if (cached.conn && cached.conn?._readyState === 1) {
    return cached.conn;
  }

  // Common options
  const opts = {
    bufferCommands: false,
    ...(maxPoolSize ? { maxPoolSize } : {}),
    ...(minPoolSize ? { minPoolSize } : {}),
    ...(maxConnecting ? { maxConnecting } : {}),
    ...(maxIdleTimeMS ? { maxIdleTimeMS } : {}),
    ...(waitQueueTimeoutMS ? { waitQueueTimeoutMS } : {}),
    ...(autoIndex != undefined ? { autoIndex } : {}),
    ...(autoCreate != undefined ? { autoCreate } : {}),
  };
  logger.info('Mongo Connection options');
  logger.info(JSON.stringify(opts, null, 2));
  mongoose.set('strictQuery', true);

  // 1. If we have a configured URI and haven't fallen back yet, try it.
  if (MONGO_URI && !localMongo) {
    try {
       console.log('Attempting to connect to configured MONGO_URI...');
       cached.promise = mongoose.connect(MONGO_URI, opts);
       cached.conn = await cached.promise;
       return cached.conn;
    } catch (err) {
       console.error('Failed to connect to configured MONGO_URI:', err.message);
       console.log('Switching to local fallback...');
       // Reset state
       cached.promise = null;
       cached.conn = null;
       try { 
         await mongoose.disconnect(); 
         if (mongoose.connection) {
            await mongoose.connection.close();
         }
       } catch (e) { /* ignore */ }
    }
  }

  // 2. Initialize Fallback if needed (either no URI originally, or previous attempt failed)
  if (!localMongo) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const path = require('path');
        const fs = require('fs');
        
        const dbPath = path.join(__dirname, '..', 'data', 'mongodb');
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
        }

        logger.info('Initializing local embedded MongoDB (fallback)...');
        
        // Add local libs to LD_LIBRARY_PATH for legacy OpenSSL support
        const libsDir = path.resolve(__dirname, '..', 'data', 'libs');
        process.env.LD_LIBRARY_PATH = `${libsDir}:${process.env.LD_LIBRARY_PATH || ''}`;

        localMongo = await MongoMemoryServer.create({
            instance: {
                dbPath: dbPath,
            },
            binary: {
                version: '4.4.18'
            }
        });
        MONGO_URI = localMongo.getUri();
        // Critical: Update process.env.MONGO_URI so other modules (like Casbin) use the fallback URI
        process.env.MONGO_URI = MONGO_URI;
        logger.info(`Local MongoDB started at ${MONGO_URI}`);
      } catch (err) {
        logger.error('Failed to start local MongoDB fallback', err);
        throw new Error('Please define the MONGO_URI environment variable or ensure mongodb-memory-server can run.');
      }
  }

  // 3. Connect to the (now guaranteed valid) URI (either original or local)
  if (!cached.conn || cached.conn._readyState !== 1) {
      // Double check if mongoose is already connected to something else to prevent "openUri" error
      // Force wait for disconnection
      if (mongoose.connection.readyState !== 0) {
          try { await mongoose.disconnect(); } catch (e) { console.error('Disconnect error:', e); }
          
          let retries = 0;
          while (mongoose.connection.readyState !== 0 && retries < 20) {
              await new Promise(resolve => setTimeout(resolve, 100));
              retries++;
          }
          if (mongoose.connection.readyState !== 0) {
             console.error('Mongoose failed to disconnect fully. Attempting to force close...');
             try { await mongoose.connection.close(); } catch(e) {}
          }
      }
      
      cached.promise = mongoose.connect(MONGO_URI, opts);
      cached.conn = await cached.promise;
  }

  return cached.conn;
}

module.exports = {
  connectDb,
};
