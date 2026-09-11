import * as m from '$lib/paraglide/messages'
import { z } from 'zod'

const targetSchema = z.object({
  categoryId: z.string().min(1),
  value: z
    .number({ message: m.allocation_targets_validation_required() })
    .min(0, { message: m.allocation_targets_validation_range() })
    .max(100, { message: m.allocation_targets_validation_range() })
    .multipleOf(0.1, {
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

      const totalTenths = targets.reduce(
        (total, target) => total + Math.round(target.value * 10),
        0,
      )
      if (totalTenths === 1000) return

      context.addIssue({
        code: 'custom',
        message: m.allocation_targets_validation_total(),
        path: ['targets'],
      })
    })
}

export type AllocationTargetsInput = z.infer<
  ReturnType<typeof createAllocationTargetsSchema>
>
