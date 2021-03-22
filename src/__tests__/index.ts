import {makeAsyncReconciler} from ".."

describe("Async reconciler", () => {
  it("works", async () => {
    type State = {value: number}
    const reconcile = jest.fn(async (a: State, b: State) => b)
    return new Promise<State>((resolve) => {
      const reconciler = makeAsyncReconciler({
        initialState: {value: 1},
        reconcile,
        statesAreEqual: (a, b) => a.value === b.value,
        log: console.log,
        onSettle: (s) => resolve(s),
      })

      reconciler.requestState({value: 2})
      reconciler.requestState({value: 3})
      reconciler.requestState({value: 4})
      reconciler.requestState({value: 5})
      reconciler.requestState({value: 6})
      reconciler.requestState({value: 7})
    }).then((n) => {
      expect(n).toEqual({value: 7})

      // 2 calls (first 1 -> 2, second 2 -> 7)
      expect(reconcile).toHaveBeenCalledTimes(2)
    })
  })
})
