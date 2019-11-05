# fluids

This library is a tiny glue layer for observable events.

- Create a tree of observable values
- Let parent nodes send arbitrary events to children (for maximum flexibility)
- Stay small yet provide helpers for easier integration

&nbsp;

## API

- `hasFluidValue(target: any): boolean`

  Returns `true` if the given value is a fluid object.

- `getFluidValue(target: any): any`

  Returns the current value of the fluid object (if possible),
  otherwise the argument is passed through as-is.

- `getFluidConfig(target: any): FluidConfig`

  Returns the `FluidConfig` object that allows for observing the argument

- `setFluidConfig(target: object, config: FluidConfig): void`

  Defines the hidden property that holds the `FluidConfig` object.
  Newer calls override older calls.

- `addFluidObserver(target: object, observer: FluidObserver): () => void`

  Attach an observer to a fluid object, and get an unsubscribe function back.
  Returns `undefined` if the first argument is not a fluid object.

&nbsp;

## Types

- `class FluidValue<T, EventType> implements FluidConfig<T, EventType>`

  The `FluidValue` class is convenient for automatic TypeScript compatibility
  with other libraries using `fluids`. The constructor sets each instance as
  its own `FluidConfig` (eg: `setFluidConfig(this, this)`), so you need to
  implement the `onParentChange(event)` method in your subclass. Remember,
  you're not required to use `FluidValue` at all. The `setFluidConfig`
  function is enough if you don't want TypeScript interop OOTB.

- `interface FluidConfig<T, EventType>`

  The `FluidConfig` interface has three methods: `get`, `addChild`, and
  `removeChild`. These methods act as a compatibility layer between
  libraries and their custom event-based solutions.

- `interface FluidObserver<EventType>`

  The `FluidObserver` interface has one method, `onParentChange(event)`,
  which is called by observed `FluidConfig` objects whenever a new event
  occurs (like a "change" event).

- `interface FluidEvent<T>`

  The basic shape that every `FluidConfig` event must adhere to.

- `interface ChangeEvent<T>`

  The basic shape that every "change" event must adhere to.

&nbsp;

## `FluidConfig` example

This example adds observability to a ref object (like in React: `{ value }`).

Any object can conform to the `FluidConfig` interface **without needing to change its public API.**

```ts
import { setFluidConfig, FluidObserver, FluidEvent } from 'fluids'

/** Create a `{ value }` object that can be observed */
function createRef(value) {
  const ref = {}

  // Observer tracking
  const children = new Set<FluidObserver>()
  const emit = (event: FluidEvent) =>
    children.forEach(child => child.onParentChange(event))

  // Change tracking
  const get = () => value
  Object.defineProperty(ref, 'value', {
    enumerable: true,
    get,
    set: newValue => {
      if (value !== newValue) {
        value = newValue
        emit({
          type: 'change',
          parent: ref,
          value,
        })
      }
    }
  })

  // Observer API
  setFluidConfig(ref, {
    get,
    addChild: child => children.add(child),
    removeChild: child => children.delete(child),
  })

  return ref
}
```

&nbsp;

## `FluidObserver` example

This example shows how to observe a fluid object.

```ts
import { addFluidObserver } from 'fluids'

const ref = createRef(0)
const stop = addFluidObserver(ref, {
  onParentChange(event) {
    if (event.type === 'change') {
      console.log(event.value, event.parent)
    }
  }
})

ref.value++
stop()
ref.value++
```
