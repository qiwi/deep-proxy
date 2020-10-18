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
  trapName: TTrapName,
  root: TTarget,
  args: any[],
  path: string[],
  value: any,
  newValue?: any,
  key?: keyof T,
  handler: TProxyHandler, // eslint-disable-line
  PROXY: symbol,
  DEFAULT: symbol,
}

export type TProxyHandler = <T>(proxyContext: THandlerContext<T>) => any

export type TTrapContext = {
  trapName: TTrapName
  root: TTarget
  handler: TProxyHandler
  path: string[]
}

export const DEFAULT = Symbol('default')
export const PROXY = Symbol('proxy')

export interface DeepProxyConstructor {
  new <T extends TTarget>(
    target: T,
    handler: TProxyHandler,
    path?: string[],
    root?: TTarget
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
  const { path, root, trapName, handler } = trapContext
  const args = [target, prop, val, receiver]
  const key = trapsWithKey.includes(trapName) ? prop : undefined
  const value = key && target[key]
  const newValue = trapName === 'set' ? val : undefined

  return {
    args,
    trapName,
    path,
    root,
    target,
    value,
    newValue,
    key,
    handler,
    PROXY,
    DEFAULT,
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
  const { value } = handlerContext
  const result = handler(handlerContext)

  if (result === PROXY && typeof value === 'object') {
    return new DeepProxy(value, handler, [prop as string], root)
  }

  if (result === DEFAULT) {
    // eslint-disable-next-line
    return Reflect[trapName](target as TTarget & Function, prop, val, receiver)
  }

  return result
}

const createTraps = (root: TTarget, handler: TProxyHandler, path: string[]) =>
  trapNames.reduce((traps, trapName): TTraps => {
    traps[trapName] = trap.bind({ path, root, trapName, handler })
    return traps
  }, {} as TTraps) as ProxyHandler<TTarget>

export const DeepProxy = class <T extends TTarget> {
  constructor(
    target: T,
    handler: TProxyHandler,
    path: string[] = [],
    root: TTarget = target,
  ) {
    return new Proxy(target, createTraps(root, handler, path))
  }
} as DeepProxyConstructor
