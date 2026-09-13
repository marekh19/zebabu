<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import type { BudgetCategory } from '$lib/budget-planning/model'
  import { formatPercentage } from '$lib/utils'
  import * as Card from '@zebabu/ui/card'
  import {
    AllocationComparisonState,
    createAllocationComparisonRows,
    createAllocationComparisonText,
    getAllocationChartScale,
  } from './comparison'

  type Props = {
    budgetCategories: readonly BudgetCategory[]
  }

  let { budgetCategories }: Props = $props()

  const rows = $derived(createAllocationComparisonRows(budgetCategories))
  const scale = $derived(getAllocationChartScale(rows))

  function comparisonText(row: (typeof rows)[number]) {
    return createAllocationComparisonText(row, formatPercentage, {
      under: (value) => m.allocation_chart_under({ value }),
      onTarget: (value) => m.allocation_chart_on_target({ value }),
      over: (value) => m.allocation_chart_over({ value }),
      description: (values) => m.allocation_chart_row_description(values),
    })
  }
</script>

{#if rows.length > 0}
  <Card.Root aria-labelledby="allocation-comparison-title">
    <Card.Header class="gap-1">
      <Card.Title id="allocation-comparison-title">
        {m.allocation_chart_title()}
      </Card.Title>
      <Card.Description>{m.allocation_chart_description()}</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-5">
      <div
        class="text-muted-foreground flex justify-between text-xs tabular-nums"
        aria-hidden="true"
      >
        <span>
          {m.allocation_chart_scale_label({ value: formatPercentage(0) })}
        </span>
        <span>
          {m.allocation_chart_scale_label({ value: formatPercentage(scale) })}
        </span>
      </div>
      <div class="space-y-6" role="list">
        {#each rows as row (row.id)}
          {@const text = comparisonText(row)}
          <div role="listitem" aria-label={text.description} class="space-y-2">
            <div
              class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
            >
              <span class="font-medium">{row.category.name}</span>
              <span
                class="text-sm tabular-nums {row.state ===
                AllocationComparisonState.OnTarget
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'}"
              >
                {m.allocation_chart_row_summary({
                  budgeted: formatPercentage(row.budgetedShare),
                  target: formatPercentage(row.target),
                  status: text.status,
                })}
              </span>
            </div>
            <div
              class="bg-muted relative h-5 overflow-visible rounded-sm"
              aria-hidden="true"
            >
              <div
                class="h-full rounded-sm"
                style:width={`${(row.budgetedShare / scale) * 100}%`}
                style:background-color={`var(--color-${row.category.color}-500)`}
              ></div>
              <div
                class="bg-foreground absolute top-[-0.25rem] h-7 w-0.5 -translate-x-1/2 rounded-full"
                style:left={`${(row.target / scale) * 100}%`}
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>
{/if}
