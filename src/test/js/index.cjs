describe('js builds', () => {
  it('DeepProxy is properly exported (cjs)', async () => {
    expect(typeof require('@qiwi/deep-proxy').DeepProxy).toBe('function') // eslint-disable-line
  })
})
