import { apiGroup } from "@xanots/sdk";

/**
 * Every recertification endpoint lives under /api:recert/… . The canonical slug
 * is pinned so public paths are stable across deploys and `getPath()` resolves
 * in the browser bundle without a lock file.
 */
export const recertApi = apiGroup({ name: "recert", canonical: "recert" });
