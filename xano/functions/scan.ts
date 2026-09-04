import { defineFunction, s, c, ref, col, expr, and, or, withFilters, fl } from "@xanots/sdk";
import { entitlements } from "../tables/entitlements.js";
import { employees } from "../tables/employees.js";
import { recertPolicies } from "../tables/recert-policies.js";
import { recertReviews } from "../tables/recert-reviews.js";

/**
 * The governed recertification scan.
 *
 * For every active entitlement it reads the risk-tier policy, computes the
 * recert due date (from last_recertified_at, or the grant date if never
 * recertified, plus the tier interval), and opens a review item for anything
 * past due or held by a terminated employee. An entitlement that already has an
 * open review is skipped, so a re-run does not duplicate work (idempotent).
 *
 * Both the manual POST recert/runs/execute endpoint and the daily scheduled task
 * call this one function, so the button a reviewer presses and the cron that
 * runs overnight enforce exactly the same policy.
 *
 * The policy and employee lookups are guarded for null before any field is read
 * off them: a looked-up row that binds null (a tier with no policy, or a brief
 * read lag on a fresh environment) then skips that entitlement for this pass
 * instead of failing the whole scan.
 */
export const runRecertificationScan = defineFunction({
  name: "run_recertification_scan",
  description:
    "Flag active entitlements past their risk-tier recert interval, or held by a terminated employee, into open review items. Idempotent: skips entitlements that already have an open review.",
  stack: [
    s.set_var("flagged", c.int(0)),
    s.set_var("already_open", c.int(0)),
    s.db.query({ table: entitlements, where: expr(col("status"), "=", c.text("active")), as: "ents" }),
    s.set_var("scanned", withFilters(ref("ents"), fl.count())),
    s.foreach({
      as: "ent",
      list: ref("ents"),
      body: [
        s.db.get({ table: recertPolicies, fieldName: "risk_tier", fieldValue: ref("ent.risk_tier"), as: "pol" }),
        s.db.get({ table: employees, fieldName: "id", fieldValue: ref("ent.employee_id"), as: "emp" }),
        s.conditional({
          // Guard the looked-up rows before drilling into pol.* / emp.*.
          when: and(
            expr(ref("pol", { safe: true }), "!=", c.null()),
            expr(ref("emp", { safe: true }), "!=", c.null()),
          ),
          then: [
            // base = last_recertified_at ?? granted_at
            s.set_var("base", withFilters(ref("ent.last_recertified_at"), fl.first_notnull(ref("ent.granted_at")))),
            // due = base + interval_days * one day in ms
            s.set_var("window_ms", withFilters(ref("pol.interval_days"), fl.mul(86400000))),
            s.set_var("due", withFilters(ref("base"), fl.add(ref("window_ms")))),
            s.conditional({
              when: or(
                expr(ref("emp.status"), "=", c.text("terminated")),
                expr(c.now(), ">=", ref("due")),
              ),
              then: [
                s.db.query({
                  table: recertReviews,
                  where: [
                    expr(col("entitlement_id"), "=", ref("ent.id")),
                    expr(col("status"), "=", c.text("open")),
                  ],
                  returnType: "count",
                  as: "open_ct",
                }),
                s.conditional({
                  when: expr(ref("open_ct"), "=", c.int(0)),
                  then: [
                    s.set_var(
                      "reason",
                      withFilters(c.text("Past "), fl.concat(ref("pol.interval_days")), fl.concat("-day recert interval")),
                    ),
                    s.conditional({
                      when: expr(ref("emp.status"), "=", c.text("terminated")),
                      then: [s.update_var("reason", c.text("Employee terminated with active access"))],
                    }),
                    s.db.add({
                      table: recertReviews,
                      row: {
                        entitlement_id: ref("ent.id"),
                        policy_id: ref("pol.id"),
                        employee_id: ref("ent.employee_id"),
                        opened_at: c.now(),
                        due_at: withFilters(ref("due"), fl.to_int()),
                        status: "open",
                        reason: ref("reason"),
                        employee_name: ref("emp.name"),
                        system_name: ref("ent.system_name"),
                        access_level: ref("ent.access_level"),
                        risk_tier: ref("ent.risk_tier"),
                      },
                    }),
                    s.update_var("flagged", withFilters(ref("flagged"), fl.add(1))),
                  ],
                  else: [s.update_var("already_open", withFilters(ref("already_open"), fl.add(1)))],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
  response: { scanned: ref("scanned"), flagged: ref("flagged"), already_open: ref("already_open") },
});
