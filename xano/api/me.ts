import { query, s, auth, ref } from "@xanots/sdk";
import { recertApi } from "./recert.js";
import { users } from "../tables/users.js";

/**
 * Return the authenticated user and role. Drives the frontend's role-aware UI.
 * The password column is excluded from the output.
 */
export const meQuery = query({
  name: "me",
  verb: "GET",
  apiGroup: recertApi,
  auth: users,
  stack: [
    s.db.get({ table: users, fieldName: "id", fieldValue: auth("id"), output: ["id", "email", "name", "role"], as: "me" }),
  ],
  response: ref("me"),
});
