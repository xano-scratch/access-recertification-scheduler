import { query, s, ref } from "@xanots/sdk";
import { recertApi } from "./recert.js";
import { users } from "../tables/users.js";
import { reviewSignoffs } from "../tables/review-signoffs.js";

/**
 * The append-only audit trail: every sign-off and revocation, newest first. Any
 * authenticated user may read it (viewer or above), so a read-only role can
 * audit decisions without being able to act on them.
 */
export const auditQuery = query({
  name: "audit",
  verb: "GET",
  apiGroup: recertApi,
  auth: users,
  stack: [
    s.db.query({ table: reviewSignoffs, sort: [{ sortBy: "created_at", dir: "desc" }], as: "rows" }),
  ],
  response: ref("rows"),
});
