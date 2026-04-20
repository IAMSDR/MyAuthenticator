import { db } from "hub:db";

import * as schema from "../db/schema";
export { sql, eq, and, or } from "drizzle-orm";

export const tables = schema;

export function useDrizzle() {
  return db;
}
