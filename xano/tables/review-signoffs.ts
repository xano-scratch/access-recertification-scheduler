import { table, f } from "@xanots/sdk";
import { recertReviews } from "./recert-reviews.js";
import { users } from "./users.js";

/**
 * The append-only audit record: one row per decision, written and never updated.
 * This is the regulator-readable log. It snapshots who acted (name + role) and
 * what was affected, so a reader sees the whole decision without joining back to
 * mutable rows.
 */
export const reviewSignoffs = table({
  name: "review_signoffs",
  schema: {
    review_id: f.tableRef(recertReviews, { required: true }),
    reviewer_id: f.tableRef(users, { required: true }),
    decision: f.enum(["signed_off", "revoked"], { required: true }),
    note: f.text(),
    acted_at: f.timestamp({ required: true }),
    reviewer_name: f.text({ required: true }),
    reviewer_role: f.text({ required: true }),
    employee_name: f.text({ required: true }),
    system_name: f.text({ required: true }),
  },
  index: [{ type: "btree", fields: [{ name: "review_id" }] }],
});
