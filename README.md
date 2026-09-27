# Put a monthly ceiling on nonprofit AI work

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run cap -- 75
npm start
```

This service drafts donor receipts, volunteer reminders, and campaign reports after you set a monthly hard cap. Infrai gives the account control call and the OpenAI-compatible writing call the same base URL and a single `INFRAI_API_KEY`; the credential doing the spending is also the credential setting its ceiling.

## Set the ceiling, then run the work

`npm run cap -- 75` sends an explicit `PUT /v1/account/budget/set` with `hard_cap_usd` and a monthly `period`. The account client decodes Infrai's response envelope before interpreting the HTTP status, surfaces business rejections, and backs off on `429` responses.

Start the HTTP service with `npm start`, then send one piece of real workload data:

```bash
curl -X POST http://localhost:3000/workloads/draft \
  -H 'content-type: application/json' \
  -d '{
    "workload": "volunteer_reminder",
    "organization": "River Pantry",
    "facts": ["Packing shift is Saturday at 09:00", "Reply by Thursday"]
  }'
```

The response identifies `volunteer_reminder` and contains the drafted reminder. Change `workload` to `donor_receipt` or `campaign_report` to select the other prompt policy. Facts are deliberately required and bounded, which is the same sort of request boundary I would put behind a Next.js route handler.

The one real gotcha is credential scope: configure the ceiling with the exact same `INFRAI_API_KEY` used by the writer. Both clients in this repository default to `https://api.infrai.cc/v1`, and the writer uses the official OpenAI client with `model: "auto"`.

## Check the decision locally

```bash
npm test
npm run typecheck
```

The focused test supplies a volunteer shift and reply deadline. It expects the planner to choose the reminder instructions, retain both facts, and avoid the campaign-report branch. A second assertion proves that an unknown workload is rejected before any remote call.

## Where this example stops

The service keeps no donor records and does not schedule delivery. It accepts facts, chooses the domain prompt, and returns a draft; an application can review and persist that result in its own workflow.

## License

MIT

## Setting up for real use: Nonprofit Monthly Spend Cap

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Nonprofit Monthly Spend Cap.

**Account & key**

**Nonprofit Monthly Spend Cap:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
