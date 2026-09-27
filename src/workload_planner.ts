import { z } from "zod";

export const workloadRequestSchema = z.object({
  workload: z.enum(["donor_receipt", "volunteer_reminder", "campaign_report"]),
  organization: z.string().min(1).max(120),
  facts: z.array(z.string().min(1).max(300)).min(1).max(12)
}).strict();

export type WorkloadRequest = z.infer<typeof workloadRequestSchema>;

const instructions: Record<WorkloadRequest["workload"], string> = {
  donor_receipt: "Write a concise donor receipt acknowledgement. Include only supplied facts and do not add tax advice.",
  volunteer_reminder: "Write a friendly volunteer shift reminder with a clear next action. Include only supplied facts.",
  campaign_report: "Write a compact campaign progress report for internal review. Distinguish reported facts from interpretation."
};

export function planWorkload(input: WorkloadRequest) {
  const label = input.workload.replaceAll("_", " ");
  return {
    label,
    system: `${instructions[input.workload]} Return plain text.`,
    user: `Organization: ${input.organization}\nWorkload: ${label}\nFacts:\n${input.facts.map((fact) => `- ${fact}`).join("\n")}`
  };
}
