import { query, input, s, c, ref, inp, auth, col, or, expr } from "@xanots/sdk";
import { recertApi } from "./recert.js";
import { users } from "../tables/users.js";
import { recertReviews } from "../tables/recert-reviews.js";
import { recertPolicies } from "../tables/recert-policies.js";
import { employees } from "../tables/employees.js";
import { entitlements } from "../tables/entitlements.js";
import { reviewSignoffs } from "../tables/review-signoffs.js";

/**
 * One review with its full governed context: the policy that set the interval,
 * the employee (so a terminated subject is visible), the current entitlement
 * row, and every prior decision recorded against it. Reviewer role or above. An
 * unknown id answers 404.
 */
export const reviewDetailQuery = query({
  name: "reviews/{review_id}",
  verb: "GET",
  apiGroup: recertApi,
  auth: users,
  input: { review_id: input.int({ required: true }) },
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
    s.db.get({ table: recertPolicies, fieldName: "id", fieldValue: ref("rev.policy_id"), as: "policy" }),
    s.db.get({ table: employees, fieldName: "id", fieldValue: ref("rev.employee_id"), as: "employee" }),
    s.db.get({ table: entitlements, fieldName: "id", fieldValue: ref("rev.entitlement_id"), as: "entitlement" }),
    s.db.query({
      table: reviewSignoffs,
      where: expr(col("review_id"), "=", inp("review_id")),
      sort: [{ sortBy: "created_at", dir: "desc" }],
      as: "history",
    }),
  ],
  response: {
    review: ref("rev"),
    policy: ref("policy"),
    employee: ref("employee"),
    entitlement: ref("entitlement"),
    history: ref("history"),
  },
});
