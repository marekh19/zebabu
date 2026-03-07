CREATE TABLE "budget_category" (
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"category_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "budgetCategory_budgetId_categoryId_unique" UNIQUE("budget_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "transaction" RENAME COLUMN "category_id" TO "budget_category_id";--> statement-breakpoint
ALTER TABLE "category" DROP CONSTRAINT "category_budget_id_budget_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_category_id_category_id_fk";
--> statement-breakpoint
DROP INDEX "category_budgetId_idx";--> statement-breakpoint
DROP INDEX "transaction_categoryId_idx";--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_category" ADD CONSTRAINT "budget_category_budget_id_budget_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_category" ADD CONSTRAINT "budget_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgetCategory_budgetId_idx" ON "budget_category" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "budgetCategory_categoryId_idx" ON "budget_category" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_budget_category_id_budget_category_id_fk" FOREIGN KEY ("budget_category_id") REFERENCES "public"."budget_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_userId_idx" ON "category" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transaction_budgetCategoryId_idx" ON "transaction" USING btree ("budget_category_id");--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "budget_id";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_userId_name_unique" UNIQUE("user_id","name");