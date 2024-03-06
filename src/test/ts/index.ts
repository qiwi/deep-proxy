import { ICallable } from '@qiwi/substrate'
import util from 'node:util'

import {
  createDeepProxy,
  DeepProxy,
  DEFAULT,
  TProxyHandler,
} from '../../main/ts/index.ts'

const simpleNestHandler: TProxyHandler = ({
  trapName,
  value,
  DEFAULT,
  PROXY,
}) => {
  if (
    trapName === 'get' &&
    ((typeof value === 'object' && value !== null) ||
      typeof value === 'function')
  ) {
    return PROXY
  }

  return DEFAULT
}

describe('DeepProxy', () => {
  it('works exactly like in usage examples', () => {
    const target = { foo: 'bar', a: { b: 'c' } }
    const proxy = new DeepProxy(
      target,
      ({ trapName, value, key, PROXY }: any = {}) => {
        if (trapName === 'set') {
          throw new TypeError('target is immutable')
        }

        if (trapName === 'get') {
          if (typeof value === 'object' && value !== null) {
            return PROXY
          }

          if (key === 'd') {
            return 'baz'
          }

          return 'qux'
        }

        return DEFAULT
      },
    )

    expect(proxy.foo).toBe('qux')
    expect(proxy.a.b).toBe('qux')
    expect(() => {
      proxy.foo = 'a'
    }).toThrowError('target is immutable')
    expect(Object.keys(proxy)).toEqual(['foo', 'a'])
    // @ts-ignore
    expect(proxy.a.d).toBe('baz')
  })

  it('uses default handler, if 2nd arg is empty', () => {
    const target = { foo: 'bar' }
    const proxy = new DeepProxy(target)

    expect(proxy.foo).toBe('bar')
    expect(util.types.isProxy(proxy)).toBeTruthy()
  })

  it('proxy handler gets proper context', (done) => {
    const target = { foo: 'bar' }
    const proxy = new DeepProxy(
      target,
      ({
        trapName,
        value,
        newValue,
        key,
        DEFAULT,
        PROXY,
        root,
        path,
        proxy: _proxy,
      }: any = {}) => {
        if (trapName === 'set') {
          expect(value).toBe('bar')
          expect(newValue).toBe('baz')
          expect(key).toBe('foo')
          expect(root).toBe(target)
          expect(path).toEqual([])
          expect(typeof DEFAULT).toBe('symbol')
          expect(typeof PROXY).toBe('function')
        }

        if (trapName === 'get') {
          expect(value).toBe('baz')
          expect(newValue).toBeUndefined()
          expect(key).toBe('foo')
          expect(root).toBe(target)
          expect(path).toEqual([])
          expect(util.types.isProxy(_proxy)).toBeTruthy()
          expect(proxy).toBe(_proxy)
          done()
        }

        return DEFAULT
      },
    )

    expect((proxy.foo = 'baz')).toBe('baz')
    expect(proxy.foo).toBe('baz')
  })

  it('proxy could be applied to complex function-with-props targets', () => {
    // eslint-disable-next-line
    const wrapper = <T extends ICallable>(fn: T) =>
      function (this: any, ...args: Parameters<T>) {
        return (fn.call(this, ...args) + '').toUpperCase()
      }
    // eslint-disable-next-line
    const fn = function () {
      // @ts-ignore
      return this.foo
    }
    const target = {
      fn,
      foo: 'foo',
    }
    // eslint-disable-next-line
    const inner = function () {
      return 'inner'
    }
    inner.baz = 'baz'
    fn.bar = { baz: 'qux' }
    fn.inner = inner

    const proxy = new DeepProxy(
      target,
      ({
        trapName,
        value,
        handler,
        DEFAULT,
        PROXY,
        rootContext,
        path,
        proxy,
        key,
      }: any = {}) => {
        if (trapName === 'get') {
          if (typeof value === 'object' && value !== null) {
            return PROXY
          }

          if (typeof value === 'function') {
            return new DeepProxy(
              Object.assign(wrapper(value).bind(proxy), value),
              handler,
              [...path, key],
              rootContext,
            )
          }
        }

        return DEFAULT
      },
    )

    expect(proxy.fn()).toBe('FOO')
    expect(proxy.fn.bar.baz).toBe('qux')
    expect(proxy.fn.inner()).toBe('INNER')
    expect(proxy.fn.inner.baz).toBe('baz')
  })

  it('throws error on target type mismatch', () => {
    // @ts-ignore
    expect(() => new DeepProxy(undefined, simpleNestHandler)).toThrow(
      'Deep proxy could be applied to objects and functions only',
    )
  })

  it('wraps both objects and functions', () => {
    const foo = () => 'foo' // eslint-disable-line
    const target = {
      foo,
      bar: { baz: 'qux' },
      null: null, // eslint-disable-line
    }
    foo.foo = 'foo.foo'

    const proxy = new DeepProxy(target, simpleNestHandler)

    expect(proxy.foo()).toBe('foo')
    expect(proxy.foo.foo).toBe('foo.foo')
    expect(proxy.bar.baz).toBe('qux')
    expect(proxy.null).toBeNull()
  })

  it('supports proxy caching', () => {
    const target = { foo: { bar: { baz: 'qux' } } }

    const proxy1 = new DeepProxy(target, simpleNestHandler)
    const proxy2 = new DeepProxy(target, simpleNestHandler)

    expect(proxy1).toBe(proxy2)
    expect(proxy1.foo).toBe(proxy1.foo)
    expect(proxy2.foo).toBe(proxy2.foo)
    expect(proxy1.foo).toBe(proxy2.foo)
    expect(proxy1.foo).not.toBe(target.foo)
  })

  it('updates parentProxyContext if target changes', () => {
    const target = { foo: { bar: { baz: 'baz' } } }

    const proxy = new DeepProxy(target, simpleNestHandler)
    const foo = proxy.foo
    const bar = proxy.foo.bar

    expect(proxy.foo).toBe(foo)
    expect(proxy.foo.bar).toBe(bar)

    // @ts-ignore
    proxy.foo = { bar: { b: 'c' } }

    const foo1 = proxy.foo
    const bar1 = proxy.foo.bar

    expect(proxy.foo).toBe(foo1)
    expect(proxy.foo.bar).toBe(bar1)
    expect(proxy.foo).not.toBe(foo)
    expect(foo.bar).toBe(bar)
  })

  it('can be applied to callables', () => {
    const target = (v: any) => v +'-test' // eslint-disable-line
    const proxy = new DeepProxy(target, ({trapName, args, DEFAULT}) => {
      if (trapName === 'apply') {
        return target(args.map((v: any) => v.toUpperCase()))
      }

      return DEFAULT
    })

    expect(proxy('test')).toBe('TEST-test')
  })

  describe('directives', () => {
    describe('PROXY', () => {
      it('builds proper context on chaining', () => {
        const target = { foo: { bar: { baz: 'qux' } } }
        const proxy = new DeepProxy(
          target,
          ({ trapName, target, root, key, value, PROXY, DEFAULT, path }) => {
            if (trapName === 'get') {
              if (typeof value === 'object' && value !== null) {
                return PROXY
              }

              return {
                path,
                key,
                target,
                root,
              }
            }

            return DEFAULT
          },
        )

        expect(proxy.foo.bar.baz).toEqual({
          path: ['foo', 'bar'],
          key: 'baz',
          target: target.foo.bar,
          root: target,
        })
      })

      it('can be used as function', () => {
        const target = { foo: { bar: 'baz' } }
        const proxy = new DeepProxy(target, ({ value, trapName, PROXY }) => {
          if (
            trapName === 'get' &&
            typeof value === 'object' &&
            value !== null
          ) {
            return PROXY({ baz: 'qux' })
          }

          return DEFAULT
        })

        // @ts-ignore
        expect(proxy.foo.baz).toBe('qux')
      })
    })
  })

  it('proxy as fn chain', () => {
    // eslint-disable-next-line
    const proxy: any = new DeepProxy(() => {}, ({target, args, PROXY, DEFAULT, path, trapName}) => {
      if (trapName === 'get') return PROXY(target)
      if (trapName === 'apply') return path.join('.') + (args.length > 0 ? `(${args.join(',')})` : '')

      return DEFAULT
    })

    expect(proxy.foo()).toBe('foo')
    expect(proxy.foo.bar()).toBe('foo.bar')
    expect(proxy.foo.bar.baz()).toBe('foo.bar.baz')
    expect(proxy.foo.bar.baz(1,2)).toBe('foo.bar.baz(1,2)')
  })
})

describe('createDeepProxy', () => {
  it('factory returns proper result', () => {
    const target = { foo: { bar: { baz: 'qux' } } }
    const proxy = createDeepProxy(target, simpleNestHandler)

    expect(proxy.foo.bar.baz).toBe('qux')
    expect(util.types.isProxy(proxy)).toBeTruthy()
  })
})
