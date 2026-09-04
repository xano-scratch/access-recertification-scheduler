import { table, f } from "@xanots/sdk";
import { employees } from "./employees.js";

/**
 * A single grant of access held by an employee. `granted_at` is when access was
 * given; `last_recertified_at` is null until a reviewer signs it off. The scan
 * computes the recert due date from whichever is later.
 */
export const entitlements = table({
  name: "entitlements",
  schema: {
    employee_id: f.tableRef(employees, { required: true }),
    system_name: f.text({ required: true }),
    access_level: f.text({ required: true }),
    risk_tier: f.enum(["low", "medium", "high", "critical"], { required: true }),
    status: f.enum(["active", "revoked"], { required: true }),
    granted_at: f.timestamp({ required: true }),
    last_recertified_at: f.timestamp({ nullable: true }),
  },
  index: [{ type: "btree", fields: [{ name: "employee_id" }] }],
});
