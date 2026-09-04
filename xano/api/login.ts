import { query, input, s, c, ref, inp, obj, expr } from "@xanots/sdk";
import { recertApi } from "./recert.js";
import { users } from "../tables/users.js";

/**
 * Authenticate a user and mint an auth token. The submitted password is taken as
 * text (not input.password, which would double-hash it) and compared against the
 * stored hash with s.security.check_password. The token carries the role and
 * name as extras. Valid credentials only; a bad email or password both answer
 * the same 401 so the endpoint does not reveal which was wrong.
 */
export const loginQuery = query({
  name: "auth/login",
  verb: "POST",
  apiGroup: recertApi,
  input: {
    email: input.email({ required: true }),
    password: input.text({ required: true }),
  },
  stack: [
    s.db.get({
      table: users,
      fieldName: "email",
      fieldValue: inp("email"),
      output: ["id", "email", "name", "role", "password"],
      as: "u",
    }),
    s.precondition({
      expr: expr(ref("u", { safe: true }), "!=", c.null()),
      error: c.text("Invalid email or password."),
      error_type: "unauthorized",
    }),
    s.security.check_password({ text_password: inp("password"), hash_password: ref("u.password"), as: "ok" }),
    s.precondition({
      expr: expr(ref("ok"), "=", c.bool(true)),
      error: c.text("Invalid email or password."),
      error_type: "unauthorized",
    }),
    s.security.create_auth_token({
      table: users,
      id: ref("u.id"),
      extras: obj({ role: ref("u.role"), name: ref("u.name") }),
      as: "token",
    }),
  ],
  response: {
    token: ref("token"),
    user: obj({ id: ref("u.id"), email: ref("u.email"), name: ref("u.name"), role: ref("u.role") }),
  },
});
