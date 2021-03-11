const $get = Symbol.for('FluidValue.get')
const $observers = Symbol.for('FluidValue.observers')

export {
  FluidValue,
  hasFluidValue,
  getFluidValue,
  getFluidObservers,
  callFluidObserver,
  callFluidObservers,
  // Mutations
  setFluidGetter,
  addFluidObserver,
  removeFluidObserver,
}

/** Returns true if `arg` can be observed. */
const hasFluidValue = (arg: any): arg is FluidValue => Boolean(arg && arg[$get])

/**
 * Get the current value.
 * If `arg` is not observable, `arg` is returned.
 */
const getFluidValue: GetFluidValue = (arg: any) =>
  arg && arg[$get] ? arg[$get]() : arg

/** Get the current observer set. Never mutate it directly! */
const getFluidObservers: GetFluidObservers = (target: any) =>
  target[$observers] || null

/** Send an event to an observer. */
function callFluidObserver<E extends FluidEvent>(
  observer: FluidObserver<E>,
  event: E
): void

function callFluidObserver(
  observer: FluidObserver,
  event: UnsafeFluidEvent
): void

function callFluidObserver(
  observer: any,
  event: FluidEvent | UnsafeFluidEvent
) {
  if (observer.eventObserved) {
    observer.eventObserved(event)
  } else {
    observer(event)
  }
}

/** Send an event to all observers. */
function callFluidObservers<E extends FluidEvent>(
  target: FluidValue<any, E>,
  event: E
): void

function callFluidObservers(target: object, event: UnsafeFluidEvent): void

function callFluidObservers(target: any, event: FluidEvent | UnsafeFluidEvent) {
  let observers: Set<FluidObserver> = target[$observers]
  if (observers) {
    observers.forEach((observer) => {
      callFluidObserver(observer, event)
    })
  }
}

type GetFluidValue = {
  <T, U = never>(target: T | FluidValue<U>): Exclude<T, FluidValue> | U
}

type GetFluidObservers = {
  <E extends FluidEvent>(target: FluidValue<any, E>): ReadonlySet<
    FluidObserver<E>
  > | null
  (target: object): ReadonlySet<FluidObserver> | null
}

/** An event sent to `FluidObserver` objects. */
export interface FluidEvent<T = any> {
  type: string
  parent: FluidValue<T>
}

/** @internal */
export interface AnyEvent extends FluidEvent {
  [key: string]: any
}

/** @internal */
export interface UnsafeFluidEvent {
  type: string
  parent: object
  [key: string]: any
}

/**
 * Extend this class for automatic TypeScript support when passing this
 * value to `fluids`-compatible libraries.
 */
abstract class FluidValue<T = any, E extends FluidEvent<T> = AnyEvent> {
  // @ts-ignore
  private [$get]: () => T
  // @ts-ignore
  private [$observers]?: Set<FluidObserver<E>>

  constructor(get?: () => T) {
    if (!get && !(get = this.get)) {
      throw Error('Unknown getter')
    }
    setFluidGetter(this, get)
  }

  /** Get the current value. */
  protected get?(): T
  /** Called after an observer is added. */
  protected observerAdded?(count: number, observer: FluidObserver<E>): void
  /** Called after an observer is removed. */
  protected observerRemoved?(count: number, observer: FluidObserver<E>): void
}

/** An observer of `FluidValue` objects. */
export type FluidObserver<E extends FluidEvent = AnyEvent> =
  | { eventObserved(event: E): void }
  | { (event: E): void }

/** Add the `FluidValue` type to every property. */
export type FluidProps<T> = T extends object
  ? { [P in keyof T]: T[P] | FluidValue<Exclude<T[P], void>> }
  : unknown

/** Remove the `FluidValue` type from every property. */
export type StaticProps<T extends object> = {
  [P in keyof T]: T[P] extends FluidValue<infer U> ? U : T[P]
}

/** Define the getter called by `getFluidValue`. */
const setFluidGetter = (target: object, get: () => any) =>
  setHidden(target, $get, get)

/** Observe a `fluids`-compatible object. */
function addFluidObserver<T, E extends FluidEvent>(
  target: FluidValue<T, E>,
  observer: FluidObserver<E>
): typeof observer

function addFluidObserver<E extends FluidEvent>(
  target: object,
  observer: FluidObserver<E>
): typeof observer

function addFluidObserver(target: any, observer: FluidObserver) {
  if (target[$get]) {
    let observers: Set<FluidObserver> = target[$observers]
    if (!observers) {
      setHidden(target, $observers, (observers = new Set()))
    }
    if (!observers.has(observer)) {
      observers.add(observer)
      if (target.observerAdded) {
        target.observerAdded(observers.size, observer)
      }
    }
  }
  return observer
}

/** Stop observing a `fluids`-compatible object. */
function removeFluidObserver<E extends FluidEvent>(
  target: FluidValue<any, E>,
  observer: FluidObserver<E>
): void

function removeFluidObserver<E extends FluidEvent>(
  target: object,
  observer: FluidObserver<E>
): void

function removeFluidObserver(target: any, observer: FluidObserver) {
  let observers: Set<FluidObserver> = target[$observers]
  if (observers && observers.has(observer)) {
    const count = observers.size - 1
    if (count) {
      observers.delete(observer)
    } else {
      setHidden(target, $observers, null)
    }
    if (target.observerRemoved) {
      target.observerRemoved(count, observer)
    }
  }
}

const setHidden = (target: any, key: any, value: any) =>
  Object.defineProperty(target, key, {
    value,
    writable: true,
    configurable: true,
  })
