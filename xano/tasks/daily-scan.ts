import { task, s } from "@xanots/sdk";
import { runRecertificationScan } from "../functions/scan.js";

/**
 * The headline capability: the recertification scan registered as a scheduled
 * task. It runs once a day and calls the same run_recertification_scan function
 * the manual endpoint does, so the overnight cron and the run-now button enforce
 * identical policy. Scheduled tasks fire on the ephemeral too.
 */
export const dailyScanTask = task({
  name: "recert_daily_scan",
  description: "Runs the recertification scan once a day.",
  schedule: [{ startsOn: "2026-01-01T00:00:00Z", freq: 86400, repeatEnabled: true }],
  stack: [s.function.run({ fn: runRecertificationScan, as: "result" })],
});
