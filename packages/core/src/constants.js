// Action event types, which signal current action dispatching status
const ActionStatus = {
  CREATED: 'created',
  UNKNOWN: 'unknown',
  READY: 'ready',
  EXECUTION: 'execution',
  SUCCESS: 'success',
  ERROR: 'error'
}

// Corresponding event names for specified action events,
// emitted by ActionDispatcher
const ActionEvent = {
  [ActionStatus.CREATED]: 'action-created',
  [ActionStatus.UNKNOWN]: 'action-unknown',
  [ActionStatus.READY]: 'action-ready',
  [ActionStatus.EXECUTION]: 'action-execution',
  [ActionStatus.SUCCESS]: 'action-success',
  [ActionStatus.ERROR]: 'action-error'
}

exports.ActionStatus = ActionStatus
exports.ActionEvent = ActionEvent
