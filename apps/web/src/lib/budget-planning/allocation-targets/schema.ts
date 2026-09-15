import { allocationTargetsRule } from '$lib/budget-planning/validation'
import * as m from '$lib/paraglide/messages'
import { z } from 'zod'
import {
  hasAllocationTargetPrecision,
  hasCompleteAllocationTargetTotal,
  isAllocationTargetInRange,
} from './rules'

const targetSchema = z.object({
  categoryId: z.string().min(1),
  value: z
    .number({ message: m.allocation_targets_validation_required() })
    .refine(isAllocationTargetInRange, {
      message: m.allocation_targets_validation_range(),
    })
    .refine(hasAllocationTargetPrecision, {
      message: m.allocation_targets_validation_precision(),
    }),
})

export function createAllocationTargetsSchema() {
  return z
    .object({
      enabled: z.boolean(),
      targets: z.array(targetSchema),
    })
    .superRefine(({ enabled, targets }, context) => {
      if (!enabled) return

      if (hasCompleteAllocationTargetTotal(targets)) return

      context.addIssue({
        code: 'custom',
        message: m.allocation_targets_validation_total(),
        path: ['targets'],
      })
    })
    .pipe(allocationTargetsRule)
}
