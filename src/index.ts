const $config = Symbol.for('FluidValue:config')

export {
  hasFluidValue,
  getFluidValue,
  getFluidConfig,
  setFluidConfig,
  addFluidObserver,
}

/** Does the given value have a `FluidConfig` object? */
const hasFluidValue = (arg: any): arg is FluidValue => !!getFluidConfig(arg)

/** Get the current value of a fluid object. Returns the first argument when it's not a fluid object. */
function getFluidValue<T, U = never>(
  target: T | FluidValue<U>
): Exclude<T, FluidValue> | U
function getFluidValue(arg: any) {
  const config = getFluidConfig(arg)
  return config ? config.get() : arg
}

type GetFluidConfig<T> = T extends FluidValue<infer U, infer E>
  ? FluidConfig<U, E>
  : FluidConfig | undefined

/** Get the methods for observing the given object. Returns undefined if not a fluid object. */
function getFluidConfig<T>(arg: T): GetFluidConfig<T>
function getFluidConfig(arg: any) {
  if (arg) return arg[$config]
}

/** Set the methods for observing the given object. */
function setFluidConfig(target: object, config: FluidConfig) {
  Object.defineProperty(target, $config, {
    value: config,
    configurable: true,
  })
}

/** Add an observer to a fluid object. Returns an unsubscribe function if the target is a fluid object, otherwise undefined. */
function addFluidObserver<E extends FluidEvent>(
  target: FluidValue<any, E>,
  observer: FluidObserver<E>
): () => void

function addFluidObserver(
  target: object,
  observer: FluidObserver
): (() => void) | undefined

function addFluidObserver(target: object, observer: FluidObserver) {
  const config = getFluidConfig(target)
  if (config) {
    config.addChild(observer)
    return () => config!.removeChild(observer)
  }
}

export interface ChangeEvent<T = any> {
  type: 'change'
  parent: FluidValue<T>
  value: T
}

/**
 * An event sent to `FluidObserver` objects.
 */
export interface FluidEvent<T = any> {
  type: string
  parent: FluidValue<T>
}

/**
 * Compatibility layer for external data sources.
 */
export interface FluidConfig<T = any, Event extends FluidEvent<T> = any> {
  get(): T
  addChild(child: FluidObserver<Event>): void
  removeChild(child: FluidObserver<Event>): void
}

/**
 * This class stores a single dynamic value, which can be observed by multiple `FluidObserver` objects.
 *
 * In order to support non-writable streams, this class doesn't expect a `set` method to exist.
 *
 * It can send *any* event to observers, not only change events.
 */
export abstract class FluidValue<T = any, Event extends FluidEvent<T> = any>
  implements FluidConfig<T, Event> {
  constructor() {
    setFluidConfig(this, this)
  }
  abstract get(): T
  abstract addChild(child: FluidObserver<Event>): void
  abstract removeChild(child: FluidObserver<Event>): void
}

/**
 * This object can observe any `FluidValue` object that sends compatible events.
 */
export interface FluidObserver<Event extends FluidEvent = any> {
  onParentChange(event: ChangeEvent | Event): void
}

/**
 * Add the `FluidValue` type to every property.
 */
export type FluidProps<T> = T extends object
  ? { [P in keyof T]: T[P] | FluidValue<Exclude<T[P], void>> }
  : unknown
