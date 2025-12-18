import gcloudCredentials from "./gcloud";
import { GoogleAuth } from "google-auth-library";

type Payload = { student_id: string; quiz_id: string; teacher_id: string; }

export default async function enqueueCloudRun(payload: Payload): Promise<{ message: string; status: number }> {
  const createTaskUrl = `https://cloudtasks.googleapis.com/v2/projects/${gcloudCredentials.project_id}/locations/${gcloudCredentials.region}/queues/quizify-correction-queue/tasks`;

  // Get an access token using ADC (works on App Engine)
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken?.token) {
    return {
      message: "Failed to obtain access token for Cloud Tasks",
      status: 500,
    };
  }

  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url: `${gcloudCredentials.cloud_run_function_url}/quizCorrection`,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      oidcToken: {
        serviceAccountEmail: gcloudCredentials.client_email,
        audience: gcloudCredentials.cloud_run_function_url,
      },
    },
  };

  const resp = await fetch(createTaskUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!resp.ok) {
    return {
      message: "Failed to push Cloud Task",
      status: 500
    }
  }

  return {
    message: "Successfully pushed Cloud Task",
    status: 200
  }
}