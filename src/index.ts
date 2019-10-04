const $config = Symbol.for('FluidValue:config')

/** Access the internal config for observing a `FluidValue` object. */
export function getFluidConfig<T, Event extends FluidEvent<T>>(
  arg: FluidValue<T, Event>
): FluidConfig<T, Event>
export function getFluidConfig(arg: any): FluidConfig | undefined
export function getFluidConfig(arg: any): FluidConfig | undefined {
  if (arg) return arg[$config]
}

/** Set the internal config for observing a `FluidValue` object. */
export function setFluidConfig(target: object, config: FluidConfig) {
  Object.defineProperty(target, $config, { value: config })
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
 * This class stores a single mutable value, which can be observed by a `FluidObserver` object.
 * The best part is that it can send *any* event to observers, not only change events.
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
