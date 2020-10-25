import { TProxy, TProxyCache, TTarget, TTraps } from './interface'

const cache: TProxyCache = {
  proxies: new WeakMap(),
  traps: new WeakMap(),
}

const getCache = <M extends WeakMap<any, any>, K>(
  map: M,
  key: K,
  Constructor: any = Map,
) => map.get(key) || map.set(key, new Constructor()).get(key)

export const addToCache = <T extends TTarget>(
  root: TTarget,
  target: T,
  path: string[],
  traps: TTraps,
  proxy: TProxy<T>,
) => {
  getCache(getCache(cache.traps, root), target, Map).set(path.join('.'), traps)
  cache.proxies.set(traps, proxy)
}

export const getFromCache = <T extends TTarget>(
  root: TTarget,
  target: T,
  path: string[],
) =>
  cache.proxies.get(
    cache.traps.get(root)?.get(target)?.get(path.join('.')) as TTraps,
  )
