# Compose Cross-context Persistence at the Application Root

Identity owns the User table. Budget Planning receives that table through `createBudgetPlanningSchema` at the application persistence composition root. This preserves database foreign keys and relations without either context importing the other. Persistence remains app-local because its migrations and runtime are specific to this application.
