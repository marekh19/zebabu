export function shouldAcceptDialogOpenChange(
  nextOpen: boolean,
  submitting: boolean,
) {
  return nextOpen || !submitting
}
