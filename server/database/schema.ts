import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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
  icontype: text("icontype", { enum: ["normal", "simple"] }).notNull(),
  createdAt: text("createdAt")
    .notNull()
    .default(sql`(current_timestamp)`),
});
