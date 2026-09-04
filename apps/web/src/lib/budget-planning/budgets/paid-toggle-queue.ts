type PaidToggleQueueOptions = {
  persist: (transactionId: string, isPaid: boolean) => Promise<void>
  onChange: (transactionId: string, isPaid: boolean) => void
  onBusyChange: (transactionId: string, isBusy: boolean) => void
  onError: () => void
}

type PaidToggleWorker = {
  confirmed: boolean
  desired: boolean
  running: boolean
}

export function createPaidToggleQueue(options: PaidToggleQueueOptions) {
  const workers = new Map<string, PaidToggleWorker>()

  async function run(transactionId: string, worker: PaidToggleWorker) {
    worker.running = true
    options.onBusyChange(transactionId, true)

    while (worker.desired !== worker.confirmed) {
      const desired = worker.desired

      try {
        await options.persist(transactionId, desired)
      } catch {
        options.onChange(transactionId, worker.confirmed)
        workers.delete(transactionId)
        options.onBusyChange(transactionId, false)
        options.onError()
        return
      }

      worker.confirmed = desired
    }

    worker.running = false
    options.onBusyChange(transactionId, false)
  }

  function toggle(transactionId: string, currentState: boolean) {
    const worker = workers.get(transactionId) ?? {
      confirmed: currentState,
      desired: currentState,
      running: false,
    }

    workers.set(transactionId, worker)
    worker.desired = !worker.desired
    options.onChange(transactionId, worker.desired)

    if (!worker.running) void run(transactionId, worker)
  }

  return { toggle }
}
