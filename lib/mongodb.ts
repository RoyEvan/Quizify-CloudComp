import { Db, MongoClient } from "mongodb";

if (!process.env.QUIZIFY_MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "QUIZIFY_MONGODB_URI"');
}

const uri = process.env.QUIZIFY_MONGODB_URI;
const options = { appName: "devrel.template.nextjs" };
const db_name = process.env.QUIZIFY_DB_NAME;

let database: Db;
let client: MongoClient;

if (process.env.QUIZIFY_NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
    globalWithMongo._mongoClient.connect();
  }

  client = globalWithMongo._mongoClient;
  database = client.db(db_name);
}
else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  client.connect();
  database = client.db(db_name);
}

// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.

export { database, client };
