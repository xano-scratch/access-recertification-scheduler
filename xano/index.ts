import { workspace } from "@xanots/sdk";

import { users } from "./tables/users.js";
import { employees } from "./tables/employees.js";
import { entitlements } from "./tables/entitlements.js";
import { recertPolicies } from "./tables/recert-policies.js";
import { recertReviews } from "./tables/recert-reviews.js";
import { reviewSignoffs } from "./tables/review-signoffs.js";

import { recertApi } from "./api/recert.js";
import { runRecertificationScan } from "./functions/scan.js";

import { seedQuery } from "./api/seed.js";
import { loginQuery } from "./api/login.js";
import { meQuery } from "./api/me.js";
import { runsExecuteQuery } from "./api/runs-execute.js";
import { reviewsListQuery } from "./api/reviews-list.js";
import { reviewDetailQuery } from "./api/review-detail.js";
import { signoffQuery } from "./api/signoff.js";
import { revokeQuery } from "./api/revoke.js";
import { auditQuery } from "./api/audit.js";

import { dailyScanTask } from "./tasks/daily-scan.js";

/**
 * The Access Recertification Scheduler backend. A governed backend for periodic
 * access recertification: a scheduled scan flags entitlements past their
 * risk-based review interval, opens role-guarded review items, and writes every
 * sign-off and revocation to an append-only audit trail.
 */
export default workspace("access-recertification-scheduler")
  .registerTables([users, employees, entitlements, recertPolicies, recertReviews, reviewSignoffs])
  .registerApiGroups([recertApi])
  .registerFunctions([runRecertificationScan])
  .registerQueries([
    seedQuery,
    loginQuery,
    meQuery,
    runsExecuteQuery,
    reviewsListQuery,
    reviewDetailQuery,
    signoffQuery,
    revokeQuery,
    auditQuery,
  ])
  .registerTasks([dailyScanTask]);
