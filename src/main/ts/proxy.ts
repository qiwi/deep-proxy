// eslint-disable-next-line
import type {
  TTarget,
  TProxy,
  TProxyFactory,
  TTrapName,
  TTraps,
  THandlerContext,
  TProxyHandler,
  TTrapContext,
  TProxyFactoryThis,
  DeepProxyConstructor,
} from './interface'

import { addToCache, getFromCache } from './cache'

export const DEFAULT = Symbol('default')

const trapNames = Object.keys(
  Object.getOwnPropertyDescriptors(Reflect),
) as Array<TTrapName>

const trapsWithKey = new Set([
  'get',
  'has',
  'set',
  'defineProperty',
  'deleteProperty',
  'getOwnPropertyDescriptor',
])

const parseParameters = <T extends TTarget>(trapName: TTrapName, parameters: [T, ...any[]]): {
  target: T,
  name: keyof T,
  val: any,
  receiver: any,
  args: any[],
  descriptor: PropertyDescriptor,
  thisValue: any,
  prototype: any,

} => {
  // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Proxy
  let target, name, val, receiver, args, descriptor, thisValue, prototype

  // prettier-ignore
  switch (trapName) {
    case 'get':
      [target, name, receiver] = parameters
      break
    case 'set':
      [target, name, val, receiver] = parameters
      break
    case 'deleteProperty':
    case 'defineProperty':
      [target, descriptor] = parameters
      break
    case 'has':
    case 'getOwnPropertyDescriptor':
      [target, name] = parameters
      break
    case 'apply':
      [target, thisValue, args] = parameters
      break
     case 'construct':
      [target, args] = parameters
      break
    case 'setPrototypeOf':
      [target, prototype] = parameters
       break
    case 'preventExtensions':
    case 'isExtensible':
    case 'ownKeys':
    case 'getPrototypeOf':
    default:
      [target] = parameters
  }
  return {
    target,
    name,
    receiver,
    val,
    args,
    descriptor,
    thisValue,
    prototype
  }
}

const createHandlerContext = <T extends TTarget>(
  trapContext: TTrapContext,
  parameters: [T, ...any[]],
): THandlerContext<T> => {
  const { trapName, handler, traps, root, path } = trapContext
  const {target, name, val, receiver, args, descriptor, thisValue, prototype} = parseParameters(trapName, parameters)
  const key = trapsWithKey.has(trapName) ? name : undefined
  const newValue = trapName === 'set' ? val : undefined

  // prettier-ignore
  return {
    parameters,
    target,
    name,
    val,
    args,
    descriptor,
    receiver,
    thisValue,
    prototype,

    trapName,
    traps,
    path,
    handler,
    key,
    newValue,
    root,
    get proxy() { return getFromCache(root, target, path) as TProxy<T>  },
    get value() { return key && target[key] },
    DEFAULT,
    PROXY: createDeepProxy.bind({ root, handler, path: [...path, key as string] }),
  }
}

const trap = function <T extends TTarget>(
  this: TTrapContext,
  ...parameters: [T, ...any[]]
) {
  const { trapName, handler } = this
  const handlerContext = createHandlerContext(this, parameters)
  const { PROXY, DEFAULT, value } = handlerContext
  const result = handler(handlerContext)

  if (result === PROXY) {
    return PROXY(value)
  }

  if (result === DEFAULT) {
    // eslint-disable-next-line
    // @ts-ignore
    return Reflect[trapName](...parameters)
  }

  return result
}

const createTraps = (handler: TProxyHandler, root: TTarget, path: string[]) =>
  trapNames.reduce<TTraps>((traps, trapName) => {
    traps[trapName] = trap.bind({
      trapName,
      handler,
      traps,
      root,
      path,
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

export const createDeepProxy: TProxyFactory = function <T extends TTarget>(
  this: TProxyFactoryThis | void,
  target: T,
  handler?: TProxyHandler,
  path?: string[],
  root?: TTarget,
): T {
  checkTarget(target)

  const _this: TProxyFactoryThis = { ...this }
  const _handler = handler || _this.handler || defaultProxyHandler
  const _path = path || _this.path || []
  const _root = _this.root || root || target
  const _proxy = getFromCache(_root, target, _path)

  if (_proxy) {
    return _proxy as T
  }

  const traps = createTraps(_handler, _root, _path)
  const proxy = new Proxy<T>(target, traps)

  addToCache(_root, target, _path, traps, proxy)

  return proxy
}

export const DeepProxy = class<T extends TTarget> {
  constructor(
    target: T,
    handler?: TProxyHandler,
    path?: string[],
    root?: TTarget,
  ) {
    return createDeepProxy(target, handler, path, root)
  }
} as DeepProxyConstructor
