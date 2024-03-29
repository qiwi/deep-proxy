## [3.0.0](https://github.com/qiwi/deep-proxy/compare/v2.0.3...v3.0.0) (2024-03-06)

### Fixes & improvements
* perf: deps revision ([6379919](https://github.com/qiwi/deep-proxy/commit/6379919763168873579e720152e4d7295f4f2ecb))
* perf: up deps ([b30f878](https://github.com/qiwi/deep-proxy/commit/b30f878361433b5b7745699249880b3a10ecee18))

### BREAKING CHANGES
* new bundling flow may affect smth ([6379919](https://github.com/qiwi/deep-proxy/commit/6379919763168873579e720152e4d7295f4f2ecb))

## [1.8.4](https://github.com/qiwi/deep-proxy/compare/v1.8.3...v1.8.4) (2022-01-31)


### Bug Fixes

* up deps, fix some vuls ([63402a6](https://github.com/qiwi/deep-proxy/commit/63402a64f435fca7a0a3853a45f12ee65efaf46b))

## [1.8.3](https://github.com/qiwi/deep-proxy/compare/v1.8.2...v1.8.3) (2021-08-15)


### Bug Fixes

* update deps, fix some vuls ([6f852e3](https://github.com/qiwi/deep-proxy/commit/6f852e336974b752bf2a1af2f4bc5de855f824b5))

## [1.8.2](https://github.com/qiwi/deep-proxy/compare/v1.8.1...v1.8.2) (2021-04-28)


### Bug Fixes

* **pkg:** up deps, fix vuls ([98d3cd6](https://github.com/qiwi/deep-proxy/commit/98d3cd632bfc26bf9182cd148f4c4cb3d45b17de))

## [1.8.1](https://github.com/qiwi/deep-proxy/compare/v1.8.0...v1.8.1) (2020-10-25)


### Bug Fixes

* use WeakMap instead of Map for target refs ([ef44497](https://github.com/qiwi/deep-proxy/commit/ef44497d959336099a30af32f27d327b1f1c9dc6))

# [1.8.0](https://github.com/qiwi/deep-proxy/compare/v1.7.0...v1.8.0) (2020-10-25)


### Features

* apply proxies caching for root level targets ([fcc0652](https://github.com/qiwi/deep-proxy/commit/fcc0652603b534250e8eaeb73a20d89632ee57f6))

# [1.7.0](https://github.com/qiwi/deep-proxy/compare/v1.6.0...v1.7.0) (2020-10-24)


### Features

* separate proxy contexts ([05fb128](https://github.com/qiwi/deep-proxy/commit/05fb1285992815a8fd1ba15ce5eddb945c58c1f8)), closes [#13](https://github.com/qiwi/deep-proxy/issues/13)

# [1.6.0](https://github.com/qiwi/deep-proxy/compare/v1.5.0...v1.6.0) (2020-10-21)


### Features

* make `value` resolution be lazy ([26a65c8](https://github.com/qiwi/deep-proxy/commit/26a65c8e5bbefcc7cae28191c552576374bdc224))

# [1.5.0](https://github.com/qiwi/deep-proxy/compare/v1.4.1...v1.5.0) (2020-10-21)


### Features

* let PROXY directive be used as pre-configured deepProxyFactory ([9ddede1](https://github.com/qiwi/deep-proxy/commit/9ddede1b9f7392ae8674abc295dce65b253f5fb0)), closes [#5](https://github.com/qiwi/deep-proxy/issues/5)

## [1.4.1](https://github.com/qiwi/deep-proxy/compare/v1.4.0...v1.4.1) (2020-10-20)


### Bug Fixes

* **docs:** fix broken links ([9056ca1](https://github.com/qiwi/deep-proxy/commit/9056ca1ba2a6379bb62d47914ab8b3f64a74df0e))

# [1.4.0](https://github.com/qiwi/deep-proxy/compare/v1.3.1...v1.4.0) (2020-10-20)


### Bug Fixes

* **typings:** update DeepProxyConstructor iface ([185426f](https://github.com/qiwi/deep-proxy/commit/185426fbca994ea5ce5d9dec4163bbb0e746ae6e))
* check proxy target type ([e1a68e5](https://github.com/qiwi/deep-proxy/commit/e1a68e5ca915e0d2aab33aab73be694dab84d262))


### Features

* provide nested proxies caching ([ae54a7f](https://github.com/qiwi/deep-proxy/commit/ae54a7f89a1fbc20f8c17737bc0c94598fb985d6)), closes [#9](https://github.com/qiwi/deep-proxy/issues/9)

## [1.3.1](https://github.com/qiwi/deep-proxy/compare/v1.3.0...v1.3.1) (2020-10-18)


### Bug Fixes

* **readme:** fix inaccuracies and typos ([4767ae5](https://github.com/qiwi/deep-proxy/commit/4767ae5292566ed47b3a98471521b3e7083ccddd))

# [1.3.0](https://github.com/qiwi/deep-proxy/compare/v1.2.1...v1.3.0) (2020-10-18)


### Bug Fixes

* check object-like proxy targets against null ([dc46084](https://github.com/qiwi/deep-proxy/commit/dc46084ee7e545762e09b6abe37a129367738ee1))


### Features

* add createDeepProxy factory ([82eb58d](https://github.com/qiwi/deep-proxy/commit/82eb58d23909232418ba67e3891763852e64d507))


### Performance Improvements

* bundle tweak ups ([e94757f](https://github.com/qiwi/deep-proxy/commit/e94757f282947617c9ce84a66903dcd4ad6de6b8))

## [1.2.1](https://github.com/qiwi/deep-proxy/compare/v1.2.0...v1.2.1) (2020-10-18)


### Bug Fixes

* apply proper path on proxy nesting ([cb9cd77](https://github.com/qiwi/deep-proxy/commit/cb9cd774b57a079a38313c5eee577873ab47243e))

# [1.2.0](https://github.com/qiwi/deep-proxy/compare/v1.1.0...v1.2.0) (2020-10-18)


### Features

* add proxy and traps (proxyHandler methods map) to handler context ([ee6cb53](https://github.com/qiwi/deep-proxy/commit/ee6cb534bc6de7b0af14c8ab67eb42b20a40f100))

# [1.1.0](https://github.com/qiwi/deep-proxy/compare/v1.0.2...v1.1.0) (2020-10-18)


### Features

* add handler self-ref to handler context ([f1bd585](https://github.com/qiwi/deep-proxy/commit/f1bd58510bd0273a4fee3c0d17ee3d3887fa5afd))

## [1.0.2](https://github.com/qiwi/deep-proxy/compare/v1.0.1...v1.0.2) (2020-10-16)


### Bug Fixes

* improve typings ([18ec806](https://github.com/qiwi/deep-proxy/commit/18ec80690ba571e0ee8cf0452384d22b99d932f5))

## [1.0.1](https://github.com/qiwi/deep-proxy/compare/v1.0.0...v1.0.1) (2020-10-16)


### Bug Fixes

* **package:** repack in umd ([ef4e983](https://github.com/qiwi/deep-proxy/commit/ef4e9830a13a6d162293915ad47e8b6b483e96a5))

# 1.0.0 (2020-10-15)


### Features

* add basic description and impl draft ([05f4ec7](https://github.com/qiwi/deep-proxy/commit/05f4ec73f13da23866fab4f44173057f12a36496))
* add directives to proxy handler context ([793e2fb](https://github.com/qiwi/deep-proxy/commit/793e2fbc9085f0c1f615e23634cbc448e2a8900e))
* add handler directives PROXY and DEFAULT ([1a96c8d](https://github.com/qiwi/deep-proxy/commit/1a96c8d0050413c3830eea98d1bf567dcf75aec3))
