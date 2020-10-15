// eslint-disable-next-line
type TTarget = object & Record<any, any>

type TTrapName = keyof typeof Reflect

type TTrap = <T extends TTarget>(
  target: T,
  prop: keyof T,
  val: any,
  receiver: any,
) => any

// https://github.com/microsoft/TypeScript/issues/24220
type TTraps = {
  [key in TTrapName]: TTrap
}

type THandlerContext<T> = {
  target: T
  trapName: TTrapName
}
type TProxyHandler = <T>(proxyContext: THandlerContext<T>) => any

type TTrapContext = {
  trapName: TTrapName
  root: TTarget
  handler: TProxyHandler
  path: string[]
}

export const DEFAULT = Symbol('default')
export const PROXY = Symbol('proxy')

// @ts-ignore
export interface DeepProxy<T extends TTarget> extends T {} // eslint-disable-line

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
  const { path, root, trapName } = trapContext
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

export class DeepProxy<T extends TTarget> {
  constructor(
    target: T,
    handler: TProxyHandler,
    path: string[] = [],
    root: TTarget = target,
  ) {
    return new Proxy(target, createTraps(root, handler, path)) as DeepProxy<T>
  }
}
