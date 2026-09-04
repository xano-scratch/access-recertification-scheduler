// The one contract: every request path and every request/response TYPE is
// derived from the xanots query defs. Change a def in xano/ and this file
// follows at compile time. No hand-typed URLs, no hand-mirrored response shapes.
import type { InferInput, InferResponse } from "@xanots/sdk";

import { loginQuery } from "../../../xano/api/login.js";
import { meQuery } from "../../../xano/api/me.js";
import { seedQuery } from "../../../xano/api/seed.js";
import { runsExecuteQuery } from "../../../xano/api/runs-execute.js";
import { reviewsListQuery } from "../../../xano/api/reviews-list.js";
import { reviewDetailQuery } from "../../../xano/api/review-detail.js";
import { signoffQuery } from "../../../xano/api/signoff.js";
import { revokeQuery } from "../../../xano/api/revoke.js";
import { auditQuery } from "../../../xano/api/audit.js";

/** The deployed backend base URL, injected as window.XANO_HOST by
 *  `xanots deploy --static`, or read from VITE_XANO_HOST in dev. */
export const XANO_HOST: string =
  (typeof window !== "undefined" && (window as { XANO_HOST?: string }).XANO_HOST) ||
  import.meta.env.VITE_XANO_HOST ||
  "";

// ---- types derived from the defs (read + write sides) -----------------------
export type LoginBody = InferInput<typeof loginQuery>;
export type LoginResult = InferResponse<typeof loginQuery>;
export type Me = NonNullable<InferResponse<typeof meQuery>>;
export type Role = Me["role"];
export type ScanResult = InferResponse<typeof runsExecuteQuery>;
export type Review = InferResponse<typeof reviewsListQuery>[number];
export type ReviewDetailResult = InferResponse<typeof reviewDetailQuery>;
export type ReviewActionResult = InferResponse<typeof signoffQuery>;
export type AuditRow = InferResponse<typeof auditQuery>[number];

// ---- token storage ----------------------------------------------------------
const TOKEN_KEY = "recert.token";
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null): void => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

// ---- fetch helper -----------------------------------------------------------
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, verb: string, body?: unknown, withAuth = true): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const token = getToken();
  if (withAuth && token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(XANO_HOST + path, {
    method: verb,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || res.statusText || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

// ---- endpoints (path + verb come straight from each def) --------------------
export const api = {
  login: (body: LoginBody) =>
    call<LoginResult>(loginQuery.getPath(), loginQuery.verb, body, false),
  me: () => call<Me>(meQuery.getPath(), meQuery.verb),
  seed: () => call<{ ok: boolean }>(seedQuery.getPath(), seedQuery.verb, {}, false),
  runScan: () => call<ScanResult>(runsExecuteQuery.getPath(), runsExecuteQuery.verb, {}),
  listReviews: (status?: string) =>
    call<Review[]>(
      reviewsListQuery.getPath() + (status ? `?status=${encodeURIComponent(status)}` : ""),
      reviewsListQuery.verb,
    ),
  getReview: (id: number) =>
    call<ReviewDetailResult>(
      reviewDetailQuery.getPath({ params: { review_id: String(id) } }),
      reviewDetailQuery.verb,
    ),
  signoff: (id: number, note?: string) =>
    call<ReviewActionResult>(
      signoffQuery.getPath({ params: { review_id: String(id) } }),
      signoffQuery.verb,
      { note },
    ),
  revoke: (id: number, note?: string) =>
    call<ReviewActionResult>(
      revokeQuery.getPath({ params: { review_id: String(id) } }),
      revokeQuery.verb,
      { note },
    ),
  listAudit: () => call<AuditRow[]>(auditQuery.getPath(), auditQuery.verb),
};
