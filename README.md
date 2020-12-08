# fluids

This library is a tiny glue layer for observable events.

- Create a tree of observable values
- Let parent nodes send arbitrary events to children (for maximum flexibility)
- Stay small yet provide helpers for easier integration

&nbsp;

### Observe a value

Any object can be observed, but `FluidValue` objects have strongly typed 
events. Observed objects are basically event emitters whose listeners
receive every event, and they typically represent a single value.

To start observing:

```ts
import { addFluidObserver } from 'fluids'

// You can pass a function:
let observer = addFluidObserver(target, event => {
  console.log(event)
})

// or pass an object:
observer = addFluidObserver(target, {
  eventObserved(event) {
    console.log(event)
  }
})
```

To stop observing:

```ts
import { removeFluidObserver } from 'fluids'

removeFluidObserver(target, observer)
```

### Create an observed object

You can extend the `FluidValue` class for automatic TypeScript support with
`fluids`-compatible libraries.

```ts
import { FluidValue, callFluidObservers } from 'fluids'

// Your class can have multiple event types.
type RefEvent<T> = { type: 'change', value: T, parent: Ref<T> }

// This example is an observable React ref.
class Ref<T> extends FluidValue<T, RefEvent<T>> {
  private _current: T
  constructor(initialValue: T) {
    // Passing a getter to super is only required
    // if your class has no "get" method.
    super(() => this._current)

    this._current = initialValue
  }
  get current() {
    return this._current
  }
  set current(value: T) {
    this._current = value

    // Send the change to all observers.
    callFluidObservers(this, {
      type: 'change',
      value,
      parent: this,
    })
  }
  //
  // These methods are completely optional.
  //
  protected observerAdded(count: number) {
    if (count == 1) {
      // Do something when the first observer is added.
    }
  }
  protected observerRemoved(count: number) {
    if (count == 0) {
      // Do something when the last observer is removed.
    }
  }
}
```

If extending `FluidValue` isn't an option, you can outfit an object or
prototype with the `setFluidGetter` function:

```ts
import { setFluidGetter, callFluidObservers } from 'fluids'

// This example augments an existing React ref.
let { current } = ref
let get = () => current
setFluidGetter(ref, get)
Object.defineProperty(ref, 'current', {
  get,
  set(value) {
    current = value

    // Remember to notify any observers.
    callFluidObservers(ref, {
      type: 'change',
      value,
      parent: ref,
    })
  }
})
```

### For libraries

The remaining functions are useful when making a `fluids`-compatible library.

```ts
import { hasFluidValue, getFluidValue, getFluidObservers, callFluidObserver } from 'fluids'

// Check if a value is observable.
hasFluidValue(target)

// Get the current value. Returns `target` if not observable.
getFluidValue(target)

// Get the current observers (or null if none exist).
getFluidObservers(target)

// Call a single observer. Useful for special observation, like waterfalls.
callFluidObserver(observer, event)
```
