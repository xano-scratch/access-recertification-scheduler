import { table, f } from "@xanots/sdk";

/**
 * The actors who sign in. This is the native auth table (`auth: true`), so auth
 * tokens are minted from it and every protected endpoint names it as `auth:`.
 * `role` drives the API-layer RBAC: viewer < reviewer < compliance_admin.
 */
export const users = table({
  name: "users",
  auth: true,
  schema: {
    email: f.email({ required: true }),
    password: f.password({ required: true }),
    name: f.text({ required: true }),
    role: f.enum(["viewer", "reviewer", "compliance_admin"], { required: true }),
  },
  index: [{ type: "unique", fields: [{ name: "email" }] }],
});
