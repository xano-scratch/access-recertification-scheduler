import { query, input, s, c, ref, inp, auth, or, expr, withFilters, fl } from "@xanots/sdk";
import { recertApi } from "./recert.js";
import { users } from "../tables/users.js";
import { recertReviews } from "../tables/recert-reviews.js";
import { entitlements } from "../tables/entitlements.js";
import { reviewSignoffs } from "../tables/review-signoffs.js";

/**
 * Revoke access: mark the entitlement revoked, close the review revoked, and
 * append an audit row. Reviewer role or above. A review that was already
 * actioned cannot be actioned again (a state guard, HTTP 400).
 */
export const revokeQuery = query({
  name: "reviews/{review_id}/revoke",
  verb: "POST",
  apiGroup: recertApi,
  auth: users,
  input: { review_id: input.int({ required: true }), note: input.text({ required: false }) },
  stack: [
    s.db.get({ table: users, fieldName: "id", fieldValue: auth("id"), as: "me" }),
    s.precondition({
      expr: or(
        expr(ref("me.role"), "=", c.text("reviewer")),
        expr(ref("me.role"), "=", c.text("compliance_admin")),
      ),
      error: c.text("Reviewer role or above required."),
      error_type: "accessdenied",
    }),
    s.db.get({ table: recertReviews, fieldName: "id", fieldValue: inp("review_id"), as: "rev" }),
    s.precondition({
      expr: expr(ref("rev", { safe: true }), "!=", c.null()),
      error: c.text("Review not found."),
      error_type: "notfound",
    }),
    s.precondition({
      expr: expr(ref("rev.status"), "=", c.text("open")),
      error: c.text("This review was already actioned."),
      error_type: "badrequest",
    }),
    s.db.edit({ table: entitlements, fieldName: "id", fieldValue: ref("rev.entitlement_id"), row: { status: "revoked" } }),
    s.db.edit({ table: recertReviews, fieldName: "id", fieldValue: inp("review_id"), row: { status: "revoked" }, as: "updated" }),
    s.db.add({
      table: reviewSignoffs,
      row: {
        review_id: ref("rev.id"),
        reviewer_id: auth("id"),
        decision: "revoked",
        note: withFilters(inp("note"), fl.first_notempty("Access revoked")),
        acted_at: c.now(),
        reviewer_name: ref("me.name"),
        reviewer_role: ref("me.role"),
        employee_name: ref("rev.employee_name"),
        system_name: ref("rev.system_name"),
      },
      as: "audit",
    }),
  ],
  response: { review: ref("updated"), audit: ref("audit") },
});
