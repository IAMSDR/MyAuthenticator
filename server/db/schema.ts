import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type { WebAuthnCredential } from "#auth-utils";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["TOTP", "HOTP"] }).notNull(),
  issuer: text("issuer").notNull(),
  label: text("label").notNull(),
  secret: text("secret").notNull(),
  algorithm: text("algorithm", {
    enum: ["SHA1", "SHA256", "SHA512"],
  }).notNull(),
  digits: integer("digits").notNull(),
  period: integer("period").notNull(),
  counter: integer("counter").notNull(),
  icon: text("icon").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const credentials = sqliteTable(
  "credentials",
  {
    displayName: text("displayName").notNull().unique(),
    user: text("user").default("admin").notNull(),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`(current_timestamp)`),
    id: text("id").notNull().unique(),
    publicKey: text("publicKey").notNull(),
    counter: integer("counter").notNull(),
    backedUp: integer("backedUp", { mode: "boolean" }).notNull(),
    transports: text("transports", { mode: "json" })
      .notNull()
      .$type<WebAuthnCredential["transports"]>(),
  },
  (table) => [unique().on(table.id, table.displayName)]
);
