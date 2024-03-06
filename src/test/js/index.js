describe('js builds', () => {
  it('DeepProxy is properly exported (esm)', async () => {
    expect(typeof (await import('@qiwi/deep-proxy')).DeepProxy).toBe('function') // eslint-disable-line
  })
})
