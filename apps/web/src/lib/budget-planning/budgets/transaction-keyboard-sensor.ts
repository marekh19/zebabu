import { KeyboardSensor } from '@dnd-kit/dom'
import { TRANSACTION_DRAG_TYPE } from './transaction-position'

export class TransactionKeyboardSensor extends KeyboardSensor {
  protected override handleMove(
    direction: 'up' | 'down' | 'left' | 'right',
    event: KeyboardEvent,
  ) {
    if (this.manager.dragOperation.source?.type === TRANSACTION_DRAG_TYPE)
      return
    super.handleMove(direction, event)
  }
}
