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

export type THandlerContext<T extends TTarget> = {
  target: T
  trapName: TTrapName
  traps: TTraps
  root: TTarget
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
  root: TTarget
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

const refs = new WeakMap()

const createHandlerContext = <T>(
  trapContext: TTrapContext,
  target: T,
  prop?: keyof T,
  val?: any,
  receiver?: any,
) => {
  const { path, root, trapName, handler, traps } = trapContext
  const args = [target, prop, val, receiver]
  const key = trapsWithKey.includes(trapName) ? prop : undefined
  const value = key && target[key]
  const newValue = trapName === 'set' ? val : undefined

  return {
    args,
    trapName,
    traps,
    path,
    root,
    target,
    value,
    newValue,
    key,
    handler,
    PROXY,
    DEFAULT,
    get proxy() {
      return refs.get(traps)
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
  const { trapName, handler, root } = this
  const handlerContext = createHandlerContext(this, target, prop, val, receiver)
  const { value, path } = handlerContext
  const result = handler(handlerContext)

  if (
    result === PROXY &&
    ((typeof value === 'object' && value !== null) ||
      typeof value === 'function')
  ) {
    return new DeepProxy(value, handler, [...path, prop as string], root)
  }

  if (result === DEFAULT) {
    // eslint-disable-next-line
    return Reflect[trapName](target as TTarget & Function, prop, val, receiver)
  }

  return result
}

const createTraps = (root: TTarget, handler: TProxyHandler, path: string[]) =>
  trapNames.reduce((traps, trapName): TTraps => {
    traps[trapName] = trap.bind({ path, root, trapName, handler, traps })
    return traps
  }, {} as TTraps) as ProxyHandler<TTarget>

export const DeepProxy = class<T extends TTarget> {
  constructor(
    target: T,
    handler: TProxyHandler,
    path: string[] = [],
    root: TTarget = target,
  ) {
    const traps = createTraps(root, handler, path)
    const proxy = new Proxy(target, traps)

    refs.set(traps, proxy)

    return proxy
  }
} as DeepProxyConstructor
