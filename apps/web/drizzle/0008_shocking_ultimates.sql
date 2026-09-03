ALTER TABLE "user" ADD COLUMN "primary_currency" text DEFAULT 'CZK' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;