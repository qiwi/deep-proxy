import { TProxy, TProxyCache, TTarget, TTraps } from './interface'

const cache: TProxyCache = {
  proxies: new WeakMap(),
  traps: new WeakMap(),
}

const getCache = <M extends WeakMap<any, any>, K>(
  map: M,
  key: K,
  Constructor: any
) => map.get(key) || map.set(key, new Constructor()).get(key)

const getKey = (path: string[]): string => path.join(​) // eslint-disable-line no-irregular-whitespace

export const addToCache = <T extends TTarget>(
  root: TTarget,
  target: T,
  path: string[],
  traps: TTraps,
  proxy: TProxy<T>,
): void => {
  getCache(getCache(cache.traps, root, WeakMap), target, Map).set(getKey(path), traps)
  cache.proxies.set(traps, proxy)
}

export const getFromCache = <T extends TTarget>(
  root: TTarget,
  target: T,
  path: string[],
): TTarget | undefined =>
  cache.proxies.get(
    cache.traps.get(root)?.get(target)?.get(getKey(path)) as TTraps,
  )
