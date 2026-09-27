import assert from "node:assert/strict";
import test from "node:test";
import { planWorkload, workloadRequestSchema } from "../src/workload_planner";

test("a volunteer reminder stays a reminder and carries the supplied shift facts", () => {
  const request = workloadRequestSchema.parse({
    workload: "volunteer_reminder",
    organization: "River Pantry",
    facts: ["Packing shift is Saturday at 09:00", "Reply by Thursday"]
  });

  const plan = planWorkload(request);
  assert.equal(plan.label, "volunteer reminder");
  assert.match(plan.system, /clear next action/);
  assert.match(plan.user, /Packing shift is Saturday at 09:00/);
  assert.match(plan.user, /Reply by Thursday/);
  assert.doesNotMatch(plan.system, /campaign progress/);
});

test("unknown workload kinds are rejected at the request boundary", () => {
  const result = workloadRequestSchema.safeParse({
    workload: "social_post",
    organization: "River Pantry",
    facts: ["Spring drive"]
  });
  assert.equal(result.success, false);
});
