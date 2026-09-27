import { createServer } from "node:http";
import OpenAI from "openai";
import { CampaignWriter } from "./campaign_writer";
import { workloadRequestSchema } from "./workload_planner";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const writer = new CampaignWriter(apiKey);
const port = Number(process.env.PORT ?? 3000);

function send(response: import("node:http").ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/workloads/draft") {
    send(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const parsed = workloadRequestSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) {
      send(response, 400, { error: "Invalid request body", issues: parsed.error.issues });
      return;
    }
    send(response, 200, await writer.write(parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const status = error instanceof OpenAI.APIError && error.status >= 400 && error.status < 500
      ? error.status
      : 502;
    send(response, status, { error: message });
  }
}).listen(port, () => {
  console.log(`Nonprofit workload service listening on http://localhost:${port}`);
});
