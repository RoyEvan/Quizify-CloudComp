import { bucketName, gcloudStorage } from "@/lib/storage/gcp/storage";
import { s3Client } from "@/lib/storage/s3client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function fileNameToAwsLink1 (fileName: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.QUIZIFY_AWS_BUCKET_NAME,
    Key: fileName, // File name
    ResponseContentDisposition: "inline",
    ResponseContentType: 'image/jpeg'
  });

  const url = await getSignedUrl(s3Client, command,{
    expiresIn: 1000
  });

  return url;
}

export async function fileNameToGcpLink(fileName: string): Promise<string> {
  const [url] = await gcloudStorage
    .bucket(bucketName)
    .file(fileName)
    .getSignedUrl({ action: "read", expires: Date.now() + 1000*1000 });

  return url;
}