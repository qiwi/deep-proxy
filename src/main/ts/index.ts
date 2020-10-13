
type TProxyContext<T> = {
  target: T,
  trap: string
}
type TProxyHandler = <T>(proxyContext: TProxyContext<T>) => any

export const OTHERWISE = Symbol('otherwise')

// @ts-ignore
export interface DeepProxy<T extends object> extends T {} // eslint-disable-line

// eslint-disable-next-line
export class DeepProxy<T extends object> {
  constructor (target: T, handler: TProxyHandler) {
    const proxy = new Proxy({}, {get(_: any, prop: string) {
      const proxyContext = {
        target,
        trap: prop
      }

      const result = handler(proxyContext)

      return result === OTHERWISE
        ? undefined
        : () => result

    }})

    return new Proxy(target, proxy) as DeepProxy<T>
  }
}
