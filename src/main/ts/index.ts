// eslint-disable-next-line
export type TTarget = (object | Function) & Record<any, any>

export type TProxy<T extends TTarget> = T

export type TTrapName = keyof typeof Reflect

// https://github.com/microsoft/TypeScript/issues/24220
export type TTraps = ProxyHandler<TTarget>

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
  PROXY: typeof createDeepProxy // eslint-disable-line
  DEFAULT: symbol
  proxy: TProxy<TTarget>
}

export type TProxyHandler = <T>(proxyContext: THandlerContext<T>) => any

export type TTrapContext = {
  trapName: TTrapName
  handler: TProxyHandler
  traps: TTraps
}

export type TProxyContext = {
  target: TTarget // proxy target object/function
  proxy: TProxy<TTarget> // proxy reference
  root: TTarget // root level proxy's target
  path: string[] // path to current proxy from root
  nested: Map<keyof TTarget, TTraps> // nested traps mapped by their paths
}

export type TCreatorThis = {
  handler?: TProxyHandler
  path?: string[]
  parentProxyContext?: TProxyContext
}

export const DEFAULT = Symbol('default')

export interface DeepProxyConstructor {
  new <T extends TTarget>(
    target: T,
    handler?: TProxyHandler,
    path?: string[],
    parentProxyContext?: TProxyContext,
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
): THandlerContext<T> => {
  const args = [target, prop, val, receiver]
  const { trapName, handler, traps } = trapContext
  const key = trapsWithKey.includes(trapName) ? prop : undefined
  const newValue = trapName === 'set' ? val : undefined
  const parentProxyContext = contexts.get(traps) as TProxyContext
  const { root, proxy, path } = parentProxyContext

  // prettier-ignore
  return {
    target,
    trapName,
    traps,
    args,
    path,
    handler,
    key,
    newValue,
    root,
    proxy,
    get value() { return key && target[key] },
    DEFAULT,
    PROXY: createDeepProxy.bind({ parentProxyContext, handler, path: [...path, key as string] }),
  }
}

const contexts = new WeakMap<TTraps, TProxyContext>()

const trap = function <T extends TTarget>(
  this: TTrapContext,
  target: T,
  prop?: keyof T,
  val?: any,
  receiver?: any,
) {
  const { trapName, handler } = this
  const handlerContext = createHandlerContext(this, target, prop, val, receiver)
  const { PROXY, DEFAULT } = handlerContext
  const result = handler(handlerContext)

  if (result === PROXY) {
    return PROXY(handlerContext.value as TTarget)
  }

  if (result === DEFAULT) {
    // eslint-disable-next-line
    return Reflect[trapName](target as TTarget & Function, prop, val, receiver)
  }

  return result
}

const createTraps = (handler: TProxyHandler) =>
  trapNames.reduce<TTraps>((traps, trapName) => {
    traps[trapName] = trap.bind({
      trapName,
      handler,
      traps,
    })
    return traps
  }, {})

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

export const defaultProxyHandler: TProxyHandler = ({ DEFAULT }) => DEFAULT

export const createDeepProxy = function <T extends TTarget>(
  this: TCreatorThis | void,
  target: T,
  handler?: TProxyHandler,
  path?: string[],
  parentProxyContext?: TProxyContext,
): T {
  checkTarget(target)

  const _this: TCreatorThis = { ...this }
  const _handler = handler || _this.handler || defaultProxyHandler
  const _path = path || _this.path || []
  const _parentProxyContext = _this.parentProxyContext || parentProxyContext
  const key = _path[_path.length - 1]
  const root = _parentProxyContext?.root || target
  const proxyContext = contexts.get(
    _parentProxyContext?.nested.get(key) as TTraps,
  )

  if (proxyContext?.target === target) {
    return proxyContext.proxy
  }

  const traps = createTraps(_handler)
  const proxy = new Proxy(target, traps)

  _parentProxyContext?.nested.set(key, traps)

  contexts.set(traps, {
    target,
    proxy,
    nested: new Map(),
    path: _path,
    root,
  })

  return proxy
}

export const DeepProxy = class<T extends TTarget> {
  constructor(
    target: T,
    handler?: TProxyHandler,
    path?: string[],
    parentProxyContext?: TProxyContext,
  ) {
    return createDeepProxy(target, handler, path, parentProxyContext)
  }
} as DeepProxyConstructor
