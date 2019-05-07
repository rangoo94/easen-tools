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
const ActionEventByStatus = {
  [ActionStatus.CREATED]: 'action-created',
  [ActionStatus.UNKNOWN]: 'action-unknown',
  [ActionStatus.READY]: 'action-ready',
  [ActionStatus.EXECUTION]: 'action-execution',
  [ActionStatus.SUCCESS]: 'action-success',
  [ActionStatus.ERROR]: 'action-error'
}

// Set-up action event names mapping
const ActionEvent = {
  CREATED: ActionEventByStatus[ActionStatus.CREATED],
  UNKNOWN: ActionEventByStatus[ActionStatus.UNKNOWN],
  READY: ActionEventByStatus[ActionStatus.READY],
  EXECUTION: ActionEventByStatus[ActionStatus.EXECUTION],
  SUCCESS: ActionEventByStatus[ActionStatus.SUCCESS],
  ERROR: ActionEventByStatus[ActionStatus.ERROR]
}

// Set-up verbosity levels, used for Developer Experience.
const VerbosityLevel = {
  NONE: 0,
  DEVELOPMENT: 1,
  DEBUG: 2
}

// Make sure that these constants will not be modified.
if (Object.freeze) {
  Object.freeze(ActionStatus)
  Object.freeze(ActionEventByStatus)
  Object.freeze(ActionEvent)
  Object.freeze(VerbosityLevel)
}

exports.ActionStatus = ActionStatus
exports.ActionEventByStatus = ActionEventByStatus
exports.ActionEvent = ActionEvent
exports.VerbosityLevel = VerbosityLevel
