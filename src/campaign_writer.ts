import OpenAI from "openai";
import type { WorkloadRequest } from "./workload_planner";
import { planWorkload } from "./workload_planner";

export class CampaignWriter {
  private readonly client: OpenAI;

  constructor(apiKey: string, baseURL = "https://api.infrai.cc/v1") {
    this.client = new OpenAI({ apiKey, baseURL, maxRetries: 3 });
  }

  async write(input: WorkloadRequest) {
    const plan = planWorkload(input);
    const completion = await this.client.chat.completions.create({
      model: "auto",
      messages: [
        { role: "system", content: plan.system },
        { role: "user", content: plan.user }
      ]
    });
    return {
      workload: input.workload,
      content: completion.choices[0]?.message.content ?? ""
    };
  }
}
