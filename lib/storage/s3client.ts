import {S3Client} from "@aws-sdk/client-s3";

const region = process.env.QUIZIFY_AWS_BUCKET_REGION
const accessKey = process.env.QUIZIFY_AWS_ACCESS_KEY ?? ""
const secret = process.env.QUIZIFY_AWS_SECRET_ACCESS_KEY ?? ""

export const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secret,
  },
});
