import { z } from "zod";
import { InfraiAccountClient, InfraiError } from "./infrai_account";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before setting the cap");

const dollars = z.coerce.number().positive().safeParse(process.argv[2]);
if (!dollars.success) throw new Error("Pass a positive monthly cap, for example: npm run cap -- 75");

try {
  const result = await new InfraiAccountClient(apiKey).setMonthlyBudget(dollars.data);
  console.log(JSON.stringify({ hard_cap_usd: dollars.data, period: "monthly", result }, null, 2));
} catch (error) {
  if (error instanceof InfraiError) {
    console.error(JSON.stringify({ error: error.code, status: error.status }));
    process.exitCode = error.status >= 400 && error.status < 500 ? 2 : 1;
  } else {
    throw error;
  }
}
