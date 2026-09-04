import { table, f } from "@xanots/sdk";

/**
 * The access subjects: the people whose entitlements get recertified. A
 * terminated employee still holding active access is the sharpest overdue case,
 * so the scan flags their grants no matter how recently they were reviewed.
 */
export const employees = table({
  name: "employees",
  schema: {
    name: f.text({ required: true }),
    email: f.email({ required: true }),
    department: f.text({ required: true }),
    status: f.enum(["active", "terminated"], { required: true }),
  },
});
