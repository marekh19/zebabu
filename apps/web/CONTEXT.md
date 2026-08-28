# Budget Planning

Budget Planning lets a User maintain reusable Categories and apply them to monthly or scenario Budgets containing planned Transactions.

## Language

**User**:
The person who owns Budgets and a reusable Category catalog.
_Avoid_: Account, customer

**Budget**:
A monthly or scenario plan that selects Categories and assigns Transactions to them.
_Avoid_: Plan, board

**Category**:
A reusable, User-owned classification for income or expenses. A Category may appear in many Budgets.
_Avoid_: Budget category, column

**BudgetCategory**:
The placement of one Category in one Budget. It owns the Category's ordering within that Budget and contains its Transactions.
_Avoid_: Category, budget column

**Transaction**:
A planned income or expense entry assigned to a BudgetCategory.
_Avoid_: Line item, allocation

**Monthly Budget**:
A Budget for one calendar month and year. A User may have at most one for that period.

**Scenario Budget**:
A named Budget without a calendar period.
