import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import gcloudCredentials from "@/lib/storage/gcp/gcloud";

export async function POST(req: Request) {
  const payload = await req.json();
  const createTaskUrl = `https://cloudtasks.googleapis.com/v2/projects/${gcloudCredentials.project_id}/locations/${gcloudCredentials.region}/queues/quizify-correction-queue/tasks`;

  // Get an access token using ADC (works on App Engine)
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken?.token) {
    return NextResponse.json(
      { error: "Failed to obtain access token" },
      { status: 500 }
    );
  }

  const taskBody = {
    task: {
      httpRequest: {
        httpMethod: "POST" as const,
        url: `${gcloudCredentials.cloud_run_function_url}`,
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(JSON.stringify(payload)).toString("base64"),
        oidcToken: {
          serviceAccountEmail: gcloudCredentials.client_email,
          audience: gcloudCredentials.cloud_run_function_url,
        },
      },
    },
  };

  const resp = await fetch(createTaskUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskBody),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json(
      { error: "Cloud Tasks createTask failed", status: resp.status, details: text },
      { status: 500 }
    );
  }

  // Fire-and-forget: return immediately after enqueue
  return NextResponse.json({ ok: true }, { status: 200 });
}
