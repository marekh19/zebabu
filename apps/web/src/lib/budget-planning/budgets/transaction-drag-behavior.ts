export const transactionCollisionPriority = {
  item: 1,
  group: 0,
} as const

export function getTransactionBoardSnapClass(isDragging: boolean) {
  return isDragging ? 'snap-none' : 'snap-x snap-mandatory sm:snap-none'
}
