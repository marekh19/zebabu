# Snapshot Default Allocation Targets in Budgets

Category default allocation targets are templates, not live fallbacks. When a
User opts into defaults while creating a Budget, their values are copied to its
BudgetCategories; later default changes do not alter that Budget, and duplication
copies the source Budget's targets. This preserves each Budget's intended plan at
the cost of duplicated values and an explicit **Use current defaults** action.
