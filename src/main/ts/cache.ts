import type { TProxy, TProxyCache, TTarget, TTraps } from './interface.ts'

const cache: TProxyCache = {
  proxies: new WeakMap(),
  traps: new WeakMap(),
}

const getCache = <M extends WeakMap<any, any>, K>(
  map: M,
  key: K,
  Constructor: any,
) => map.get(key) || map.set(key, new Constructor()).get(key)

// prettier-ignore
const getKey = (path: string[]): string => path.join('​,') // eslint-disable-line no-irregular-whitespace

export const addToCache = <T extends TTarget>(
  root: TTarget,
  target: T,
  path: string[],
  traps: TTraps,
  proxy: TProxy<T>,
): void => {
  getCache(getCache(cache.traps, root, WeakMap), target, Map).set(
    getKey(path),
    traps,
  )
  cache.proxies.set(traps, proxy)
}

export const getFromCache = <T extends TTarget>(
  root: T,
  target: T,
  path: string[],
): TProxy<T> | undefined =>
  cache.proxies.get(
    cache.traps.get(root)?.get(target)?.get(getKey(path)) as TTraps,
  ) as unknown as TProxy<T> | undefined
