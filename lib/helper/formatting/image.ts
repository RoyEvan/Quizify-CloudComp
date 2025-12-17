import { bucketName, gcloudStorage } from "@/lib/storage/gcp/storage";

export async function fileNameToGcpLink(fileName: string): Promise<string> {
  const [url] = await gcloudStorage
    .bucket(bucketName)
    .file(fileName)
    .getSignedUrl({ action: "read", expires: Date.now() + 1000*1000 });

  return url;
}