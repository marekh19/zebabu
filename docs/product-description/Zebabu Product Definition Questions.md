---
up: '[[Budget Planner]]'
date: 2026-01-20
---

# Discovery Questions for Your Budgeting App

Let me dig deep so we can model this properly!

## 1. Budget Structure & Time Periods

**Budget Period:**

- Is it always monthly, or can users create budgets for any period (weekly, quarterly)?
  - I would say it's always for month by default. So we can then easily calculate statistics per year etc. But also we should allow to create "extra" budgets that have just a name and are not tight to certain month. So this way you can simulate scenarios - e.g. If I land a better paying job, how would my budget look like etc.
- Can you have multiple budget plans for the same month? (e.g., "Conservative November" vs "Aggressive November")
  - No, as mentioned above, by default budget is for a certain month and unique (it would fuck our stats per year etc). But you can do aggressive November, it would be just extra budget that is not "committed" to stats and not related to any specific time period. It's just named budget instead of certain month budget. We can let the user select this during new budget creation and explain what does this affect.
- Do budget periods need to have a status? (draft, active, completed, archived?)
  - No. I think there's no need for that.

**Budget Templates:**

- Are templates just "copy everything" or do they have intelligence? (e.g., "copy but adjust amounts by inflation")
  - Just copy everything. Maybe a template is not even needed. You can create a january 2026 budget and then copy it to february 2026. I guess templates would unncecessarily complicate the MVP.
- Can a template be shared? (personal vs. community templates)
  - Not for the MVP, maybe later
- Should templates remember which categories are "fixed" vs "variable"?
  - No need for templates now, but when you create budget, there should be at least income category and expense category (which we would then suggest to rename and split into multiple categories like "life expenses", "consume expenses", "debt", "investments", "savings")

## 2. Categories (The Columns)

**Category Structure:**

- Looking at your screenshot: "Příjmy" (Income), "Investice", "Životní výdaje" (Living Expenses), "Spotřební výdaje" (Consumer Expenses), "Dluhy" (Debts), "Bilance"
- Are these categories fixed or can users create custom ones?
  - User can create custom ones, totally flexible
- Can categories be nested? (e.g., "Living Expenses" > "Food" > "Groceries")
  - No need for that, that would overcomplicate things and goes against our trello board like UX
- Do categories have types? (Income vs Expense vs Savings vs Debt vs Balance/Summary)
  - Just income vs expense
- Can a category have a budget limit? (e.g., "Don't spend more than 10,000 Kč on Consumer Expenses")
  - You can set how much % of your budget you would ideally allocate per category and then check "ideal" vs "reality". See attached screenshot for an idea how this could be displayed on a chart (I think we will have a lot of data from which we can show interesting stats to the user)

**Category Metadata:**

- Should categories remember default transactions? (e.g., "Životní výdaje" always starts with Lasina, Mobil, etc.)
  - no, you just copy the whole budget and add/delete what's different. Don't overcomplicate it
- Can categories be ordered/sorted by the user?
  - Yet, via drag & drop - like in trello
- Do categories have colors or icons?
  - yes, both colors and icons

## 3. Transactions (The Lines)

**Transaction Properties:** Looking at your sheet, I see items like:

- "Lasina: 1 800 Kč ✓"
- "POV + HAV Toyota: 2 120 Kč ✓"

**Questions:**

- What's the checkmark? Is that "planned" vs "actual"? Or "paid" vs "unpaid"?
  - Checkmark is that it's paid
- Can a transaction be recurring? (e.g., "Lasina auto-creates every month")
  - As mentioned above, you just duplicate the budget, no concept of recurring transactions
- Can transactions have notes/descriptions?
  - Yes, they have title, value, isPaid, note, maybe something else in the future
- Can transactions be linked? (e.g., "This debt payment reduces this loan balance")
  - No need
- Date handling: Is every transaction tied to a specific date, or just "sometime in November"?
  - No need

**Transaction Types:**

- Do you distinguish between:
  - **Planned** (budgeted amount)
  - **Actual** (what really happened)
  - **Recurring** (auto-generated each period)
  - **One-time** (manual entry)
    -No need for this, keep it simple

## 4. The "Bilance" (Balance/Summary) Column

This looks like calculated fields:

- "VÝSLEDEK: -2 400 Kč"
- "Příjmy celkem: 127 311 Kč"
- "Výdaje celkem: 129 711 Kč"

**Questions:**

- Is this a special category type, or just formulas?
  - just formula, calculated field. This would be fixed per each budget. Since we said every budget must have at least 1 income category, 1 expense category, this is easily calculated
- What calculations do you need?
  - Total Income
  - Total Expenses by category
  - Net balance (Income - Expenses)
  - Percentage allocated per category
  - Unallocated amount
- Should these update in real-time or be computed on-demand?
  - Real time = I guess these calculated values are fine to exist on frontend only. So we don't overcomplicate stuff on the backend, right?

## 5. Allocation & Validation Rules

You mentioned: _"checks how much % you've allocated to which expense category and whether you've allocated your budget fully"_

**Business Rules:**

- Should the app prevent you from over-allocating? (spending more than income)
- Or just warn you?
  - just warn
- What's "fully allocated"? Does every single Kč need to be assigned, or is a small buffer OK?
  - Every single money unit should be allocated (zero-based budgeting)
  - Btw we should support any currency - each user can select their primary currency per their profile, we should also allow creating a transaction value in other currency than the base, we shall support recalculation.
- Should there be alerts? ("You've only allocated 80% of your income - assign the rest!")
  - We can do that

**Percentage Tracking:**

- Per category? (e.g., "Housing is 35% of income")
  - yes
- Should users be able to set target percentages? (e.g., "I want Housing to be max 30%")
  - yes, already mentioned above

## 6. Multi-Currency & Formatting

I see "Kč" everywhere:

- Is this Czech Koruna only, or multi-currency?
  - multi currency
- Do you need exchange rate handling?
  - yes
- Number formatting: "127 311 Kč" (space as thousands separator) - is this locale-based or hardcoded?
  - locale based, could be set in user preference settings

## 7. Actual vs Planned (Reconciliation)

**Critical question:**

- Is this ONLY a planning tool (you plan November before it starts)?
  - only planning tool, the trick is as soon as your income lands, you "spend" everything = allocate everything asap.
- Or does it also track actuals (you enter what you actually spent)?
  - No tracking of any bank account transactions or whatever, this is planner
- If both: How do you reconcile?
  - Separate columns? (Planned | Actual | Variance)
  - Toggle view? (Show planned vs Show actual)
  - Inline? (Each transaction has planned + actual fields)

## 8. Templates & Duplication

**When you "create from template":**

- Should amounts be editable before creating?
  - no
- Should it remember which transactions are "always include" vs "optional"?
  - no
- Can templates have smart defaults? (e.g., "Last month's actual becomes this month's plan")
  - no

**When you "duplicate a budget":**

- Does it copy everything exactly?
  - yes
- Should it ask which categories/transactions to include?
  - no
- Should it auto-adjust dates?
  - there are no dates

## 9. User Management & Sharing

- Is this single-user or multi-user?
  - single user - no organizations yet in the MVP
- Household budgets? (multiple people editing the same budget)
  - not now in the MVP. But would be nice to plan with this for the future so whenever we want this, it's not a full BE refactor of everything
- Should budgets be shareable? (read-only vs collaborative)
  - No
- Does each user have their own set of budgets?
  - Yes

## 10. Historical Data & Reporting

- Do you need to keep history? ("What did I spend on groceries in Q4 2024?")
  - Of course, that's the main purpose of this product
- Should old budgets be immutable (locked after the month ends)?
  - No need
- Reporting needs:
  - keep it simple for now, reports not super important right now in the mvp

## 11. Technical Constraints

- Offline-first? (work without internet, sync later)
  - no need to overcomplicate
- Real-time collaboration? (Google Sheets-like simultaneous editing)
  - no collab
- Mobile-friendly? (responsive or dedicated mobile app)
  - yes, mobile friendly responsive
- Export/Import? (Excel, CSV, PDF reports)
  - csv export and import

## 12. The Trello-Like UI Behavior

**Drag & Drop:**

- Can you drag transactions between categories?
  - yes
- Does that change the category of the transaction, or is it just UI reordering?
  - yes, If I drag from 1 category to another, it must change the category.
- Can you reorder categories themselves?
  - yes, as mentioned above

**Inline Editing:**

- Click to edit transaction amounts?
  - When you click the transaction, we open edit modal with form
- Quick-add transactions with keyboard shortcuts?
  - yes, good idea
- Bulk operations? (select multiple, delete, move)
  - no need

---
