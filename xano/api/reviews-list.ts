import { query, input, s, c, ref, inp, auth, col, cmp, or, expr } from "@xanots/sdk";
import { recertApi } from "./recert.js";
import { users } from "../tables/users.js";
import { recertReviews } from "../tables/recert-reviews.js";

/**
 * List review items, newest first, optionally filtered by `status`
 * (open / signed_off / revoked). Reviewer role or above. An empty status is
 * dropped from the filter (ignoreEmpty), so no status returns every review.
 */
export const reviewsListQuery = query({
  name: "reviews",
  verb: "GET",
  apiGroup: recertApi,
  auth: users,
  input: { status: input.text({ required: false }) },
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
    s.db.query({
      table: recertReviews,
      where: cmp(col("status"), "=", inp("status"), { ignoreEmpty: true }),
      sort: [{ sortBy: "created_at", dir: "desc" }],
      as: "rows",
    }),
  ],
  response: ref("rows"),
});
