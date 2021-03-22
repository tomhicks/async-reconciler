export type AsyncReconciler<State extends SomeObject> = {
  /**
   * Tells the reconciler that you would like to achieve this state, until
   * given further instruction.
   *
   * If the reconciler is busy, it will transition to this state once the previous
   * reconciliation has ended. If you request any more states while the reconciler
   * is still running, the prior states will be superseded.
   *
   * For example, if we start at state A, then very quickly request states B, C, D
   * E and F (before `A -> B` completes), the reconciler will run:
   * ```
   * A -> B ... B -> F
   * ```
   *
   * Intermediate states C, D and E are never realised.
   */
  requestState: (state: Partial<State>) => void
}

export function makeAsyncReconciler<State extends SomeObject>(params: {
  initialState: State

  /**
   * Predicate to determine if the two states are identical, and therefore
   * whether the reconciler needs to run.
   *
   * **NOTE**: Don't use object equality here, because that will never return true.
   * You probably want to do something like a deep equality check.
   */
  statesAreEqual: (a: State, b: State) => boolean

  reconcile: (current: State, next: State) => Promise<State>

  /**
   * Called if the reconcile callback rejects or throws. Ideally, you would
   * make sure to handle your own errors inside your reconciling function, so
   * you can choose how to alter the state.
   */
  onError?: (error: Error) => void

  /**
   * Called whenever the "currentState" is updated. This will happen at the
   * end of every reconcile call. This is different to `onSettle`, in that
   * `onSettle` is only called after a reconcile, and there are no further
   * calls to reconcile required.
   */
  onStateUpdate?: (newState: State) => void

  /**
   * Called whenever an update finishes and the current state matches the
   * desired state. That is, when it's "finished" until the next requestState
   * call is made.
   */
  onSettle?: (state: State) => void

  /**
   * Logs various debug pieces of debug information about the requests being
   * made and other useful lifecycle information. You can just pass console.log
   * in here for a quick look into what is going on inside.
   */
  log?: (text: string, params: unknown) => void
}): AsyncReconciler<State> {
  let currentState = params.initialState
  let targetState = params.initialState
  let isBusy = false

  function isReconcileRequired() {
    if (params.statesAreEqual(currentState, targetState)) {
      params.log?.(prefixLog("Reconcile not required - states are equal"), {
        currentState,
        targetState,
      })
      return false
    }

    return true
  }

  function reconcile() {
    isBusy = true
    params.log?.(prefixLog("Reconciling"), {
      currentState,
      targetState,
    })

    params
      .reconcile(currentState, targetState)
      .then((resultingState) => {
        params.log?.(prefixLog("Reconciled"), {
          currentState,
          targetState,
          resultingState,
        })
        currentState = resultingState
        params.onStateUpdate?.(currentState)

        isBusy = false
        if (isReconcileRequired()) {
          reconcile()
        } else {
          params.onSettle?.(currentState)
        }
      })
      .catch((e) => {
        isBusy = false
        params.onError?.(
          e instanceof Error
            ? e
            : new Error(prefixLog("Reconcile function caused an error"))
        )
      })
  }

  return {
    requestState(requestedState) {
      const previousTargetState = targetState
      targetState = {...targetState, ...requestedState}
      if (isReconcileRequired()) {
        params.log?.(prefixLog("Target state added"), {
          previousTargetState,
          targetState,
          currentState,
        })

        if (isBusy) {
          params.log?.(prefixLog("Busy - skipping reconciliation"), {
            currentState,
            targetState,
          })
          return
        }

        reconcile()
      }
    },
  }
}

function prefixLog(str: string) {
  return `AsyncReconciler: ${str}`
}

type SomeObject = Record<string, unknown>
