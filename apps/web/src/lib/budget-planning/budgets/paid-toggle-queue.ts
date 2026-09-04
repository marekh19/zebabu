import { get, writable } from 'svelte/store'

type PaidToggleQueueOptions = {
  persist: (transactionId: string, isPaid: boolean) => Promise<void>
  onChange: (transactionId: string, isPaid: boolean) => void
  onBusyChange: (transactionId: string, isBusy: boolean) => void
  onError: () => void
}

type PaidToggleWorker = {
  transactionId: string
  confirmed: boolean
  desired: boolean
  running: boolean
}

export function createPaidToggleQueue(options: PaidToggleQueueOptions) {
  const workers = writable<readonly PaidToggleWorker[]>([])

  function findWorker(transactionId: string) {
    return get(workers).find((worker) => worker.transactionId === transactionId)
  }

  function setWorker(
    transactionId: string,
    worker: PaidToggleWorker | undefined,
  ) {
    workers.update((current) => {
      const remaining = current.filter(
        (item) => item.transactionId !== transactionId,
      )
      return worker ? [...remaining, worker] : remaining
    })
  }

  async function persistLatest(transactionId: string) {
    const worker = findWorker(transactionId)
    if (!worker) return

    const desired = worker.desired

    try {
      await options.persist(transactionId, desired)
    } catch {
      options.onChange(transactionId, worker.confirmed)
      setWorker(transactionId, undefined)
      options.onBusyChange(transactionId, false)
      options.onError()
      return
    }

    const latest = findWorker(transactionId)
    if (!latest) return

    if (latest.desired !== desired) {
      setWorker(transactionId, { ...latest, confirmed: desired })
      await persistLatest(transactionId)
      return
    }

    setWorker(transactionId, undefined)
    options.onBusyChange(transactionId, false)
  }

  async function run(transactionId: string, worker: PaidToggleWorker) {
    setWorker(transactionId, { ...worker, running: true })
    options.onBusyChange(transactionId, true)
    await persistLatest(transactionId)
  }

  function toggle(transactionId: string, currentState: boolean) {
    const worker = findWorker(transactionId) ?? {
      transactionId,
      confirmed: currentState,
      desired: currentState,
      running: false,
    }
    const next = { ...worker, desired: !worker.desired }

    setWorker(transactionId, next)
    options.onChange(transactionId, next.desired)

    if (!worker.running) void run(transactionId, next)
  }

  return { toggle }
}
