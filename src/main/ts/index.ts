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

export type TSharedContext = {
  targets: WeakMap<TTarget, TTarget>
  proxies: Map<string, TTarget>
}

export type THandlerContext<T extends TTarget> = {
  target: T
  trapName: TTrapName
  traps: TTraps
  root: TTarget
  sharedContext: TSharedContext
  args: any[]
  path: string[]
  value: any
  newValue?: any
  key?: keyof T
  handler: TProxyHandler // eslint-disable-line
  PROXY: typeof createDeepProxy // eslint-disable-line
  DEFAULT: symbol
  proxy: TTarget
}

export type TProxyHandler = <T>(proxyContext: THandlerContext<T>) => any

export type TTrapContext = {
  trapName: TTrapName
  sharedContext: TSharedContext
  handler: TProxyHandler
  path: string[]
  traps: TTraps
}

export type TCreatorThis = {
  handler?: TProxyHandler
  path?: string[]
  sharedContext?: TSharedContext
}

export const DEFAULT = Symbol('default')
export const PROXY = Symbol('proxy')

export interface DeepProxyConstructor {
  new <T extends TTarget>(
    target: T,
    handler?: TProxyHandler,
    path?: string[],
    sharedContext?: TSharedContext,
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
  const { path, trapName, handler, traps, sharedContext } = trapContext
  const { proxies, targets } = sharedContext
  const key = trapsWithKey.includes(trapName) ? prop : undefined
  const value = key && target[key]
  const newValue = trapName === 'set' ? val : undefined

  return {
    args,
    trapName,
    traps,
    path,
    get root() {
      return targets.get(proxies.get('[]') as TTarget) as TTarget
    },
    target,
    key,
    value,
    newValue,
    handler,
    PROXY: createDeepProxy.bind({
      handler,
      path: [...path, key as string],
      sharedContext,
    }),
    DEFAULT,
    sharedContext,
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
  const { trapName, handler } = this
  const handlerContext = createHandlerContext(this, target, prop, val, receiver)
  const { PROXY, value } = handlerContext
  const result = handler(handlerContext)

  if (result === PROXY) {
    return PROXY(value as TTarget)
  }

  if (result === DEFAULT) {
    // eslint-disable-next-line
    return Reflect[trapName](target as TTarget & Function, prop, val, receiver)
  }

  return result
}

const createTraps = (
  sharedContext: TSharedContext,
  handler: TProxyHandler,
  path: string[],
) =>
  trapNames.reduce((traps, trapName): TTraps => {
    traps[trapName] = trap.bind({
      path,
      sharedContext,
      trapName,
      handler,
      traps,
    })
    return traps
  }, {} as TTraps) as ProxyHandler<TTarget>

export const createSharedContext = (): TSharedContext => ({
  targets: new WeakMap(),
  proxies: new Map(),
})

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
    handler: TProxyHandler | undefined = ({ DEFAULT }) => DEFAULT,
    path: string[] = [],
    sharedContext: TSharedContext = createSharedContext(),
  ) {
    checkTarget(target)

    const hash = getPathHash(path)
    const { proxies, targets } = sharedContext
    const _proxy = proxies.get(hash)

    if (_proxy) {
      if (target === targets.get(_proxy)) {
        return _proxy
      }

      proxies.delete(hash)
      targets.delete(_proxy)
    }

    const traps = createTraps(sharedContext, handler, path)
    const proxy = new Proxy(target, traps)

    proxies.set(hash, proxy)
    targets.set(proxy, target)

    return proxy
  }
} as DeepProxyConstructor

export const createDeepProxy = function <T extends TTarget>(
  this: TCreatorThis | void,
  target: T,
  handler?: TProxyHandler,
  path?: string[],
  sharedContext?: TSharedContext,
): T {
  const _this: TCreatorThis = { ...this }

  return new DeepProxy(
    target,
    handler || _this.handler,
    path || _this.path,
    sharedContext || _this.sharedContext,
  )
}
