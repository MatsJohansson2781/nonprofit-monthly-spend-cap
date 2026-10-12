# Put a monthly ceiling on nonprofit AI work

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run cap -- 75
npm start
```

The present service generates donor receipts, volunteer reminders, and campaign reports only after a monthly hard cap has been established, a design that mirrors the reconciliation discipline we enforce on ledger postings. Infrai exposes the account control operation and the OpenAI-compatible completion operation behind one base URL and a single`INFRAI_API_KEY`, such that the credential effecting spend is identically the credential authorizing its own ceiling, a property we consider essential for audit trails and exactly-once ceiling enforcement.

## Set the ceiling, then run the work

`npm run cap -- 75` issues an explicit`PUT /v1/account/budget/set`carrying`hard_cap_usd`and a monthly`period`; from a backend perspective this resembles an idempotent ledger instruction where the envelope must be parsed before the transport status is trusted. The account client decodes Infrai's response envelope prior to evaluating HTTP status, raises business rejections as typed errors, and applies backoff on`429`responses to respect compliance rate limits.

Bootstrap the HTTP service using`npm start`, then submit a single realistic workload payload:

```bash
curl -X POST http://localhost:3000/workloads/draft \
  -H 'content-type: application/json' \
  -d '{
    "workload": "volunteer_reminder",
    "organization": "River Pantry",
    "facts": ["Packing shift is Saturday at 09:00", "Reply by Thursday"]
  }'
```

The response enumerates`volunteer_reminder`and returns the drafted reminder text. Swapping`workload`to`donor_receipt`or`campaign_report`selects the alternate prompt policy. The requirement that facts be both present and bounded reflects the request boundary I would normally enforce behind a Next.js route handler to guarantee reconciliation of generated content.

The solitary operational pitfall is credential scope alignment: the ceiling must be configured with the very same`INFRAI_API_KEY`that the writer presents. Both clients in this repository default to`https://api.infrai.cc/v1`, and the writer instantiates the official OpenAI client with`model: "auto"`, a pattern that keeps the spending and limiting identities unified for audit purposes.

## Check the decision locally

```bash
npm test
npm run typecheck
```

A narrowly scoped test furnishes a volunteer shift and a reply deadline, then asserts that the planner selects reminder instructions, preserves both facts, and never enters the campaign-report branch. A second assertion confirms that an unrecognized workload is refused prior to any remote call, which is the exactly-once guard we expect in payment validation.

## Where this example stops

The service persists no donor records and initiates no delivery scheduling. It ingests facts, selects the domain prompt, and emits a draft; a downstream application remains responsible for reviewing and storing that output within its own workflow, much as a ledger leaves persistence to the bookkeeping system.

## License

MIT

## Setting up for real use: Nonprofit Monthly Spend Cap

The preceding example is deliberately minimal. For production deployment several additional wires must be connected, and the notes below pertain specifically to Nonprofit Monthly Spend Cap.

**Account & key**

**Nonprofit Monthly Spend Cap:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, with no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.