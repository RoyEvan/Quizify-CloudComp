import { Storage } from "@google-cloud/storage";
import gcloudCredentials from "./gcloud";

const bucketName = process.env.QUIZIFY_GOOGLE_STORAGE_BUCKET_NAME || "quizify-images";
const gcloudStorage = new Storage({
  projectId: process.env.QUIZIFY_GOOGLE_CLOUD_PROJECT_ID,
  // credentials: gcloudCredentials,
  credentials: gcloudCredentials,
  
});

export { gcloudStorage, bucketName };