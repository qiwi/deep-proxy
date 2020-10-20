// eslint-disable-next-line
export type TTarget = (object | Function) & Record<any, any>

export type TTrapName = keyof typeof Reflect

export type TTrap = <T extends TTarget>(
  target: T,
  prop: keyof T,
  val: any,
  receiver: any,
) => any

// https://github.com/microsoft/TypeScript/issues/24220
export type TTraps = {
  [key in TTrapName]: TTrap
}

export type TRootContext = {
  targets: WeakMap<TTarget, TTarget>
  proxies: Map<string, TTarget>
}

export type THandlerContext<T extends TTarget> = {
  target: T
  trapName: TTrapName
  traps: TTraps
  root: TTarget
  rootContext: TRootContext
  args: any[]
  path: string[]
  value: any
  newValue?: any
  key?: keyof T
  handler: TProxyHandler // eslint-disable-line
  PROXY: symbol
  DEFAULT: symbol
  proxy: TTarget
}

export type TProxyHandler = <T>(proxyContext: THandlerContext<T>) => any

export type TTrapContext = {
  trapName: TTrapName
  rootContext: TRootContext
  handler: TProxyHandler
  path: string[]
  traps: TTraps
}

export const DEFAULT = Symbol('default')
export const PROXY = Symbol('proxy')

export interface DeepProxyConstructor {
  new <T extends TTarget>(
    target: T,
    handler: TProxyHandler,
    path?: string[],
    rootContext?: TRootContext,
  ): T
}

const trapNames = Object.keys(
  Object.getOwnPropertyDescriptors(Reflect),
) as Array<TTrapName>

const trapsWithKey = [
  'get',
  'has',
  'set',
  'defineProperty',
  'deleteProperty',
  'getOwnPropertyDescriptor',
]

const createHandlerContext = <T>(
  trapContext: TTrapContext,
  target: T,
  prop?: keyof T,
  val?: any,
  receiver?: any,
) => {
  const args = [target, prop, val, receiver]
  const { path, rootContext, trapName, handler, traps } = trapContext
  const { proxies, targets } = rootContext
  const key = trapsWithKey.includes(trapName) ? prop : undefined
  const value = key && target[key]
  const newValue = trapName === 'set' ? val : undefined

  return {
    args,
    trapName,
    traps,
    path,
    rootContext,
    get root() {
      return targets.get(proxies.get('[]') as TTarget) as TTarget
    },
    target,
    value,
    newValue,
    key,
    handler,
    PROXY,
    DEFAULT,
    get proxy() {
      return proxies.get(getPathHash(path)) as TTarget
    },
  }
}

const trap = function <T extends TTarget>(
  this: TTrapContext,
  target: T,
  prop: keyof T,
  val: any,
  receiver: any,
) {
  const { trapName, handler, rootContext } = this
  const handlerContext = createHandlerContext(this, target, prop, val, receiver)
  const { value, path, key } = handlerContext
  const result = handler(handlerContext)

  if (result === PROXY) {
    return new DeepProxy(
      value as TTarget,
      handler,
      [...path, key as string],
      rootContext,
    )
  }

  if (result === DEFAULT) {
    // eslint-disable-next-line
    return Reflect[trapName](target as TTarget & Function, prop, val, receiver)
  }

  return result
}

const createTraps = (
  rootContext: TRootContext,
  handler: TProxyHandler,
  path: string[],
) =>
  trapNames.reduce((traps, trapName): TTraps => {
    traps[trapName] = trap.bind({ path, rootContext, trapName, handler, traps })
    return traps
  }, {} as TTraps) as ProxyHandler<TTarget>

export const createRootContext = (): TRootContext => {
  return {
    targets: new WeakMap(),
    proxies: new Map(),
  }
}

const checkTarget = (target: any): void => {
  if (
    target === null ||
    (typeof target !== 'object' && typeof target !== 'function')
  ) {
    throw new TypeError(
      'Deep proxy could be applied to objects and functions only',
    )
  }
}

const getPathHash = (path: string[]): string => JSON.stringify(path)

export const DeepProxy = class<T extends TTarget> {
  constructor(
    target: T,
    handler: TProxyHandler,
    path: string[] = [],
    rootContext: TRootContext = createRootContext(),
  ) {
    checkTarget(target)

    const hash = getPathHash(path)
    const { proxies, targets } = rootContext
    const _proxy = proxies.get(hash)

    if (_proxy) {
      if (target === targets.get(_proxy)) {
        return _proxy
      }

      proxies.delete(hash)
    }

    const traps = createTraps(rootContext, handler, path)
    const proxy = new Proxy(target, traps)

    proxies.set(hash, proxy)
    targets.set(proxy, target)

    return proxy
  }
} as DeepProxyConstructor

export const createDeepProxy = <T extends TTarget>(
  handler: TProxyHandler,
  target: T,
  path?: string[],
  rootContext?: TRootContext,
): T => new DeepProxy(target, handler, path, rootContext)
