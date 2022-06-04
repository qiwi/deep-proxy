export {}

// eslint-disable-next-line
export type TTarget = (object | ((...args: any[]) => any)) & Record<any, any>

export type TProxy<T extends TTarget> = T

export type TTrapName = keyof typeof Reflect

export type TTraps = ProxyHandler<TTarget>

export type THandlerContext<T extends TTarget> = {
  target: T
  name: keyof T,
  val: any,
  receiver: any,
  args: any[],
  descriptor: PropertyDescriptor,
  thisValue: any,
  prototype: any,

  trapName: TTrapName
  traps: TTraps
  root: TTarget
  parameters: any[]
  path: string[]
  value: any
  newValue?: any
  key?: keyof T
  handler: TProxyHandler // eslint-disable-line
  PROXY: TProxyFactory // eslint-disable-line
  DEFAULT: symbol
  proxy: TProxy<T>
}

export type TProxyHandler = <T extends TTarget>(proxyContext: THandlerContext<T>) => any

export type TProxyFactoryThis = {
  handler?: TProxyHandler
  path?: string[]
  root?: TTarget
}

export type TProxyFactory<T extends TTarget = TTarget> = (
  this: TProxyFactoryThis | void,
  target: T,
  handler?: TProxyHandler,
  path?: string[],
  root?: T,
) => TProxy<T>

export type TTrapContext = {
  trapName: TTrapName
  handler: TProxyHandler
  traps: TTraps
  root: TTarget
  path: string[]
}

export type TProxyCache = {
  // root object refers to some targets objects,
  // that refer to map, that binds nested paths with their traps
  traps: WeakMap<TTarget, WeakMap<TTarget, Map<string, TTraps>>>

  // And these traps refer to proxies
  proxies: WeakMap<TTraps, TProxy<TTarget>>
}

export interface DeepProxyConstructor {
  new <T extends TTarget>(
    target: T,
    handler?: TProxyHandler,
    path?: string[],
    root?: TTarget,
  ): TProxy<T>
}
