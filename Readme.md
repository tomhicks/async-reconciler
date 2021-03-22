# async-reconciler

Reconciles from one state to another, using a reconcile function that you
pass. Ignores unnecessary state changes while reconciler is running.

An example use-case for this is where you have some UI to connect/disconnect
something, and connection/disconnection takes time, and you shouldn't try
to disconnect until you've connected.

```javascript
import {makeAsyncReconciler} from "async-reconciler"
const {connect, disconnect} = myApi

const reconciler = makeAsyncReconciler({
  initialState: {
    connected: false,
  },
  statesAreEqual(a, b) {
    return a.connected === b.connected
  },
  reconcile(previous, next) {
    if (next.connected && !previous.connected) {
      return connect().then(() => ({
        connected: true,
      }))
    }

    if (!next.connected && previous.connected) {
      return disconnect().then(() => ({
        connected: false,
      }))
    }

    // should not be reached - but we didn't do anything so return old state
    return previous
  },
})

// now quickly switch the connection on and off
reconciler.requestState({connected: true}) // causes connect() to be called

// these are all 'queued' but not executed yes as connect is still happening
reconciler.requestState({connected: false})
reconciler.requestState({connected: true})
reconciler.requestState({connected: false})
reconciler.requestState({connected: true})
reconciler.requestState({connected: false})

// now connect() resolves

// disconnect() is called now, as our final call above, wants our state to be
// disconnected
```
