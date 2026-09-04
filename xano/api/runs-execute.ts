import { query, s, c, ref, auth, expr } from "@xanots/sdk";
import { recertApi } from "./recert.js";
import { users } from "../tables/users.js";
import { runRecertificationScan } from "../functions/scan.js";

/**
 * Trigger the recertification scan now: the run-now path for the demo, and the
 * same governed logic the daily scheduled task runs. Only a compliance_admin may
 * trigger it (a role precondition, HTTP 403 otherwise).
 */
export const runsExecuteQuery = query({
  name: "runs/execute",
  verb: "POST",
  apiGroup: recertApi,
  auth: users,
  stack: [
    s.db.get({ table: users, fieldName: "id", fieldValue: auth("id"), as: "me" }),
    s.precondition({
      expr: expr(ref("me.role"), "=", c.text("compliance_admin")),
      error: c.text("Only a compliance admin may run recertification."),
      error_type: "accessdenied",
    }),
    s.function.run({ fn: runRecertificationScan, as: "result" }),
  ],
  response: ref("result"),
  responseShape: null as unknown as { scanned: number; flagged: number; already_open: number },
});
