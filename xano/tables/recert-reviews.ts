import { table, f } from "@xanots/sdk";
import { entitlements } from "./entitlements.js";
import { employees } from "./employees.js";
import { recertPolicies } from "./recert-policies.js";

/**
 * A review item opened for an overdue entitlement: the workflow record. It
 * carries a snapshot of the entitlement (employee name, system, access level,
 * risk tier) as it stood when flagged, so the queue and audit read the state at
 * that moment without a join, and later edits to the source rows do not rewrite
 * history.
 */
export const recertReviews = table({
  name: "recert_reviews",
  schema: {
    entitlement_id: f.tableRef(entitlements, { required: true }),
    policy_id: f.tableRef(recertPolicies, { required: true }),
    employee_id: f.tableRef(employees, { required: true }),
    opened_at: f.timestamp({ required: true }),
    due_at: f.timestamp({ required: true }),
    status: f.enum(["open", "signed_off", "revoked"], { required: true }),
    reason: f.text({ required: true }),
    employee_name: f.text({ required: true }),
    system_name: f.text({ required: true }),
    access_level: f.text({ required: true }),
    risk_tier: f.enum(["low", "medium", "high", "critical"], { required: true }),
  },
  index: [
    { type: "btree", fields: [{ name: "entitlement_id" }] },
    { type: "btree", fields: [{ name: "status" }] },
  ],
});
