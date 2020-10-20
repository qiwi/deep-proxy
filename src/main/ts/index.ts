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
  target: TTarget
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
    root?: TTarget,
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
  const { path, rootContext, trapName, handler, traps } = trapContext
  const args = [target, prop, val, receiver]
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
      return rootContext.target
    },
    target,
    value,
    newValue,
    key,
    handler,
    PROXY,
    DEFAULT,
    get proxy() {
      return rootContext.proxies.get(path.join('.')) as TTarget
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
      key ? [...path, key as string] : path,
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

export const createRootContext = (target: TTarget): TRootContext => {
  return {
    target,
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

export const DeepProxy = class<T extends TTarget> {
  constructor(
    target: T,
    handler: TProxyHandler,
    path: string[] = [],
    rootContext: TRootContext = createRootContext(target),
  ) {
    checkTarget(target)

    const pathJoined = path.join('.')
    const _proxy = rootContext.proxies.get(pathJoined)

    if (_proxy) {
      return _proxy
    }

    const traps = createTraps(rootContext, handler, path)
    const proxy = new Proxy(target, traps)

    rootContext.proxies.set(pathJoined, proxy)

    return proxy
  }
} as DeepProxyConstructor

export const createDeepProxy = <T extends TTarget>(
  handler: TProxyHandler,
  target: T,
  path?: string[],
  rootContext?: TRootContext,
): T => new DeepProxy(target, handler, path, rootContext)
