import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Currency values are stored as integer cents. Calendar dates use YYYY-MM-DD,
// while audit timestamps use SQLite's UTC CURRENT_TIMESTAMP value.

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  authKey: text("auth_key").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  timezone: text("timezone").notNull().default("America/New_York"),
  currency: text("currency").notNull().default("CAD"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const budgetMonths = sqliteTable(
  "budget_months",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // Canonical calendar-month identifier, for example 2026-07.
    month: text("month").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("budget_months_user_month_unique").on(table.userId, table.month),
    check("budget_months_month_format", sql`${table.month} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'`),
  ],
);

export const monthlyIncomePlans = sqliteTable(
  "monthly_income_plans",
  {
    id: text("id").primaryKey(),
    budgetMonthId: text("budget_month_id")
      .notNull()
      .references(() => budgetMonths.id, { onDelete: "cascade" }),
    expectedCents: integer("expected_cents").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("monthly_income_plans_budget_month_unique").on(table.budgetMonthId),
    check("monthly_income_plans_expected_nonnegative", sql`${table.expectedCents} >= 0`),
  ],
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    status: text("status", { enum: ["planned", "posted"] }).notNull().default("posted"),
    source: text("source", { enum: ["manual", "bill_payment"] }).notNull().default("manual"),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "restrict" }),
    effectiveDate: text("effective_date").notNull(),
    notes: text("notes"),
    mood: text("mood", { enum: ["needed", "worth_it", "oops"] }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("transactions_user_effective_date_idx").on(table.userId, table.effectiveDate),
    index("transactions_user_type_status_date_idx").on(
      table.userId,
      table.type,
      table.status,
      table.effectiveDate,
    ),
    check("transactions_amount_positive", sql`${table.amountCents} > 0`),
    check(
      "transactions_expense_category_required",
      sql`${table.type} <> 'expense' OR ${table.categoryId} IS NOT NULL`,
    ),
  ],
);

export const recurringBills = sqliteTable(
  "recurring_bills",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    defaultAmountCents: integer("default_amount_cents").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    kind: text("kind", { enum: ["essential", "optional"] }).notNull(),
    autopay: integer("autopay", { mode: "boolean" }).notNull().default(false),
    frequency: text("frequency", {
      enum: ["weekly", "biweekly", "monthly", "yearly"],
    }).notNull(),
    anchorDate: text("anchor_date").notNull(),
    endDate: text("end_date"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("recurring_bills_user_active_idx").on(table.userId, table.active),
    check("recurring_bills_amount_positive", sql`${table.defaultAmountCents} > 0`),
    check(
      "recurring_bills_date_range",
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.anchorDate}`,
    ),
  ],
);

export const billOccurrences = sqliteTable(
  "bill_occurrences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    recurringBillId: text("recurring_bill_id")
      .notNull()
      .references(() => recurringBills.id, { onDelete: "restrict" }),
    dueDate: text("due_date").notNull(),
    // These snapshots preserve history when the recurring definition changes.
    amountCents: integer("amount_cents").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["upcoming", "paid", "skipped"] })
      .notNull()
      .default("upcoming"),
    paymentTransactionId: text("payment_transaction_id")
      .unique()
      .references(() => transactions.id, { onDelete: "restrict" }),
    paidAt: text("paid_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("bill_occurrences_bill_due_date_unique").on(
      table.recurringBillId,
      table.dueDate,
    ),
    index("bill_occurrences_user_status_due_date_idx").on(
      table.userId,
      table.status,
      table.dueDate,
    ),
    check("bill_occurrences_amount_positive", sql`${table.amountCents} > 0`),
    check(
      "bill_occurrences_payment_state",
      sql`(${table.status} = 'paid' AND ${table.paymentTransactionId} IS NOT NULL AND ${table.paidAt} IS NOT NULL)
        OR (${table.status} <> 'paid' AND ${table.paymentTransactionId} IS NULL AND ${table.paidAt} IS NULL)`,
    ),
  ],
);

export const savingsGoals = sqliteTable(
  "savings_goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    targetCents: integer("target_cents").notNull(),
    deadline: text("deadline"),
    status: text("status", { enum: ["active", "completed", "archived"] })
      .notNull()
      .default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("savings_goals_user_status_idx").on(table.userId, table.status),
    check("savings_goals_target_positive", sql`${table.targetCents} > 0`),
  ],
);

export const monthlySavingsPlans = sqliteTable(
  "monthly_savings_plans",
  {
    id: text("id").primaryKey(),
    budgetMonthId: text("budget_month_id")
      .notNull()
      .references(() => budgetMonths.id, { onDelete: "cascade" }),
    savingsGoalId: text("savings_goal_id")
      .notNull()
      .references(() => savingsGoals.id, { onDelete: "restrict" }),
    plannedCents: integer("planned_cents").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("monthly_savings_plans_month_goal_unique").on(
      table.budgetMonthId,
      table.savingsGoalId,
    ),
    check("monthly_savings_plans_amount_nonnegative", sql`${table.plannedCents} >= 0`),
  ],
);

export const savingsContributions = sqliteTable(
  "savings_contributions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    savingsGoalId: text("savings_goal_id")
      .notNull()
      .references(() => savingsGoals.id, { onDelete: "restrict" }),
    amountCents: integer("amount_cents").notNull(),
    effectiveDate: text("effective_date").notNull(),
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("savings_contributions_user_effective_date_idx").on(
      table.userId,
      table.effectiveDate,
    ),
    index("savings_contributions_goal_effective_date_idx").on(
      table.savingsGoalId,
      table.effectiveDate,
    ),
    check("savings_contributions_amount_positive", sql`${table.amountCents} > 0`),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  budgetMonths: many(budgetMonths),
  transactions: many(transactions),
  recurringBills: many(recurringBills),
  billOccurrences: many(billOccurrences),
  savingsGoals: many(savingsGoals),
  savingsContributions: many(savingsContributions),
}));

export const budgetMonthsRelations = relations(budgetMonths, ({ one, many }) => ({
  user: one(users, { fields: [budgetMonths.userId], references: [users.id] }),
  incomePlan: one(monthlyIncomePlans),
  savingsPlans: many(monthlySavingsPlans),
}));

export const monthlyIncomePlansRelations = relations(monthlyIncomePlans, ({ one }) => ({
  budgetMonth: one(budgetMonths, {
    fields: [monthlyIncomePlans.budgetMonthId],
    references: [budgetMonths.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  billOccurrence: one(billOccurrences),
}));

export const recurringBillsRelations = relations(recurringBills, ({ one, many }) => ({
  user: one(users, { fields: [recurringBills.userId], references: [users.id] }),
  category: one(categories, {
    fields: [recurringBills.categoryId],
    references: [categories.id],
  }),
  occurrences: many(billOccurrences),
}));

export const billOccurrencesRelations = relations(billOccurrences, ({ one }) => ({
  user: one(users, { fields: [billOccurrences.userId], references: [users.id] }),
  recurringBill: one(recurringBills, {
    fields: [billOccurrences.recurringBillId],
    references: [recurringBills.id],
  }),
  category: one(categories, {
    fields: [billOccurrences.categoryId],
    references: [categories.id],
  }),
  paymentTransaction: one(transactions, {
    fields: [billOccurrences.paymentTransactionId],
    references: [transactions.id],
  }),
}));

export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
  user: one(users, { fields: [savingsGoals.userId], references: [users.id] }),
  plans: many(monthlySavingsPlans),
  contributions: many(savingsContributions),
}));

export const monthlySavingsPlansRelations = relations(monthlySavingsPlans, ({ one }) => ({
  budgetMonth: one(budgetMonths, {
    fields: [monthlySavingsPlans.budgetMonthId],
    references: [budgetMonths.id],
  }),
  savingsGoal: one(savingsGoals, {
    fields: [monthlySavingsPlans.savingsGoalId],
    references: [savingsGoals.id],
  }),
}));

export const savingsContributionsRelations = relations(savingsContributions, ({ one }) => ({
  user: one(users, {
    fields: [savingsContributions.userId],
    references: [users.id],
  }),
  savingsGoal: one(savingsGoals, {
    fields: [savingsContributions.savingsGoalId],
    references: [savingsGoals.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type RecurringBill = typeof recurringBills.$inferSelect;
export type BillOccurrence = typeof billOccurrences.$inferSelect;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type SavingsContribution = typeof savingsContributions.$inferSelect;
