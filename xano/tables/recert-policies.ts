import { table, f } from "@xanots/sdk";

/**
 * The interval rules, one row per risk tier. This table IS the governed rule set
 * the scan reads: `interval_days` sets how often a grant at that tier must be
 * recertified. `require_dual_signoff` is carried and shown in the UI for the
 * critical tier (the workflow enforces a single sign-off today).
 */
export const recertPolicies = table({
  name: "recert_policies",
  schema: {
    risk_tier: f.enum(["low", "medium", "high", "critical"], { required: true }),
    interval_days: f.int({ required: true }),
    require_dual_signoff: f.bool({ required: true }),
  },
  index: [{ type: "unique", fields: [{ name: "risk_tier" }] }],
});
