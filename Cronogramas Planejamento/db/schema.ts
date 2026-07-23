import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const executions = sqliteTable(
  "executions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contract: text("contract").notNull(),
    item: text("item").notNull(),
    serviceOrder: text("service_order").notNull(),
    period: text("period").notNull(),
    week: integer("week").notNull().default(0),
    quantity: real("quantity").notNull(),
    isLocked: integer("is_locked", { mode: "boolean" }).notNull().default(false),
    lockedBy: text("locked_by"),
    lockedAt: text("locked_at"),
    updatedBy: text("updated_by").notNull(),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("executions_record_idx").on(
      table.contract,
      table.item,
      table.serviceOrder,
      table.period,
      table.week,
    ),
  ],
);

export const executionHistory = sqliteTable(
  "execution_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    executionId: integer("execution_id"),
    contract: text("contract").notNull(),
    item: text("item").notNull(),
    serviceOrder: text("service_order").notNull(),
    period: text("period").notNull(),
    week: integer("week").notNull().default(0),
    action: text("action").notNull(),
    previousQuantity: real("previous_quantity"),
    quantity: real("quantity").notNull(),
    changedBy: text("changed_by").notNull(),
    changedAt: text("changed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("execution_history_period_idx").on(table.contract, table.period),
    index("execution_history_record_idx").on(table.contract, table.item, table.serviceOrder, table.period, table.week),
  ],
);
