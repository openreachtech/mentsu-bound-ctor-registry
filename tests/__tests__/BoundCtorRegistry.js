import BoundCtorRegistry from '../../lib/BoundCtorRegistry.js'

const AlphaOrigin = class {
  /**
   * get: bound document ctor.
   *
   * @abstract
   * @returns {new (...args: Array<*>) => any} Bound document ctor.
   * @throws {Error} AlphaOrigin.get:boundDocument must be inherited
   */
  get boundDocument () {
    throw new Error('AlphaOrigin.get:boundDocument must be inherited')
  }
}

const BetaOrigin = class {
  /**
   * get: bound document ctor.
   *
   * @abstract
   * @returns {new (...args: Array<*>) => any} Bound document ctor.
   * @throws {Error} BetaOrigin.get:boundDocument must be inherited
   */
  get boundDocument () {
    throw new Error('BetaOrigin.get:boundDocument must be inherited')
  }
}

const FirstBindingKey = class {}
const SecondBindingKey = class {}
const ThirdBindingKey = class {}
const FourthBindingKey = class {}

describe('BoundCtorRegistry', () => {
  describe('.BoundCtorPool', () => {
    test('should be an instance of WeakMap', () => {
      const received = BoundCtorRegistry.BoundCtorPool

      expect(received)
        .toBeInstanceOf(WeakMap)
    })
  })
})

describe('BoundCtorRegistry', () => {
  describe('constructor', () => {
    describe('should keep properties', () => {
      describe('#BaseCtor', () => {
        const cases = [
          {
            input: {
              BaseCtor: AlphaOrigin,
            },
          },
          {
            input: {
              BaseCtor: BetaOrigin,
            },
          },
        ]

        test.each(cases)('BaseCtor: $input.BaseCtor', ({ input }) => {
          const registry = new BoundCtorRegistry(input)

          expect(registry)
            .toHaveProperty('BaseCtor', input.BaseCtor)
        })
      })
    })
  })
})

describe('BoundCtorRegistry', () => {
  describe('.create()', () => {
    describe('should be an instance of own class', () => {
      const cases = [
        {
          input: {
            BaseCtor: AlphaOrigin,
          },
        },
        {
          input: {
            BaseCtor: BetaOrigin,
          },
        },
      ]

      test.each(cases)('BaseCtor: $input.BaseCtor', ({ input }) => {
        const received = BoundCtorRegistry.create(input)

        expect(received)
          .toBeInstanceOf(BoundCtorRegistry)
      })
    })

    describe('should call constructor', () => {
      const cases = [
        {
          input: {
            BaseCtor: AlphaOrigin,
          },
        },
        {
          input: {
            BaseCtor: BetaOrigin,
          },
        },
      ]

      test.each(cases)('BaseCtor: $input.BaseCtor', ({ input }) => {
        const SpyClass = globalThis.constructorSpy.spyOn(BoundCtorRegistry)

        SpyClass.create(input)

        expect(SpyClass.__spy__)
          .toHaveBeenCalledWith(input)
      })
    })
  })
})

describe('BoundCtorRegistry', () => {
  describe('.ensureBindingWeakMapKey()', () => {
    describe('should be an instance of WeakMap', () => {
      const objectSchemaTally = {
        delta: ThirdBindingKey,
        epsilon: FourthBindingKey,
      }

      /**
       * @type {Array<{
       *   input: Parameters<typeof BoundCtorRegistry['ensureBindingWeakMapKey']>[0]
       * }>}
       */
      const cases = [
        {
          input: {
            bindings: [
              FirstBindingKey,
            ],
          },
        },
        {
          input: {
            bindings: [
              FirstBindingKey,
              SecondBindingKey,
            ],
          },
        },
        {
          input: {
            bindings: [
              FirstBindingKey,
              SecondBindingKey,
              objectSchemaTally,
            ],
          },
        },
      ]

      test.each(cases)('schema: $input.bindings.0.name', ({ input }) => {
        const received = BoundCtorRegistry.ensureBindingWeakMapKey(input)

        expect(received)
          .toBeInstanceOf(WeakMap)
      })
    })

    describe('should be the same reference by the same key', () => {
      const objectSchemaTally = {
        delta: ThirdBindingKey,
        epsilon: FourthBindingKey,
      }

      const cases = [
        {
          input: {
            bindings: [
              FirstBindingKey,
            ],
          },
        },
        {
          input: {
            bindings: [
              FirstBindingKey,
              SecondBindingKey,
            ],
          },
        },
        {
          input: {
            bindings: [
              FirstBindingKey,
              SecondBindingKey,
              objectSchemaTally,
            ],
          },
        },
      ]

      test.each(cases)('schema: $input.bindings.0.name', ({ input }) => {
        const firstReceived = BoundCtorRegistry.ensureBindingWeakMapKey(input)
        const secondReceived = BoundCtorRegistry.ensureBindingWeakMapKey(input)

        expect(firstReceived)
          .toBe(secondReceived) // same reference
      })
    })
  })
})

describe('BoundCtorRegistry', () => {
  describe('.ensureCtorPool()', () => {
    const alphaWeakMapKey = new WeakMap()
    const betaWeakMapKey = new WeakMap()
    const gammaWeakMapKey = new WeakMap()
    const deltaWeakMapKey = new WeakMap()

    describe('should be the same  WeakMap', () => {
      const weakMapKeyCases = [
        { weakMapKey: alphaWeakMapKey },
        { weakMapKey: betaWeakMapKey },
        { weakMapKey: gammaWeakMapKey },
        { weakMapKey: deltaWeakMapKey },
      ]

      test.each(weakMapKeyCases)('weakMapKey: $input.weakMapKey', ({ weakMapKey }) => {
        const CtorPool = BoundCtorRegistry.ensureCtorPool({
          weakMapKey,
        })

        expect(CtorPool)
          .toBeInstanceOf(WeakMap)
      })
    })

    describe('should be the same WeakMap', () => {
      const weakMapKeyCases = [
        {
          weakMapKey: alphaWeakMapKey,
          differentWeakMapKeyCases: [
            // { otherWeakMapKey: alphaWeakMapKey },
            { otherWeakMapKey: betaWeakMapKey },
            { otherWeakMapKey: gammaWeakMapKey },
            { otherWeakMapKey: deltaWeakMapKey },
          ],
        },
        {
          weakMapKey: betaWeakMapKey,
          differentWeakMapKeyCases: [
            { otherWeakMapKey: alphaWeakMapKey },
            // { otherWeakMapKey: betaWeakMapKey },
            { otherWeakMapKey: gammaWeakMapKey },
            { otherWeakMapKey: deltaWeakMapKey },
          ],
        },
        {
          weakMapKey: gammaWeakMapKey,
          differentWeakMapKeyCases: [
            { otherWeakMapKey: alphaWeakMapKey },
            { otherWeakMapKey: betaWeakMapKey },
            // { otherWeakMapKey: gammaWeakMapKey },
            { otherWeakMapKey: deltaWeakMapKey },
          ],
        },
        {
          weakMapKey: deltaWeakMapKey,
          differentWeakMapKeyCases: [
            { otherWeakMapKey: alphaWeakMapKey },
            { otherWeakMapKey: betaWeakMapKey },
            { otherWeakMapKey: gammaWeakMapKey },
            // { otherWeakMapKey: deltaWeakMapKey },
          ],
        },
      ]

      describe.each(weakMapKeyCases)('weakMapKey: $input.weakMapKey', ({ weakMapKey, differentWeakMapKeyCases }) => {
        const TargetCtorPool = BoundCtorRegistry.ensureCtorPool({
          weakMapKey,
        })

        test.each(differentWeakMapKeyCases)('otherWeakMapKey: $input.otherWeakMapKey', ({ otherWeakMapKey }) => {
          const otherCtorPool = BoundCtorRegistry.ensureCtorPool({
            weakMapKey: otherWeakMapKey,
          })

          expect(otherCtorPool)
            .toBeInstanceOf(WeakMap)

          expect(otherCtorPool)
            .not
            .toBe(TargetCtorPool) // same reference
        })
      })
    })
  })
})

describe('BoundCtorRegistry', () => {
  describe('#get:Ctor', () => {
    const cases = [
      {
        input: {
          BaseCtor: AlphaOrigin,
        },
      },
      {
        input: {
          BaseCtor: BetaOrigin,
        },
      },
    ]

    test.each(cases)('BaseCtor: $input.BaseCtor', ({ input }) => {
      const registry = BoundCtorRegistry.create(input)

      const received = registry.Ctor

      expect(received)
        .toBe(BoundCtorRegistry) // same reference
    })
  })
})

describe('BoundCtorRegistry', () => {
  describe('#ensureBoundCtor()', () => {
    const cases = [
      {
        input: {
          BaseCtor: AlphaOrigin,
        },
      },
      {
        input: {
          BaseCtor: BetaOrigin,
        },
      },
    ]

    describe.each(cases)('BaseCtor: $input.BaseCtor', ({ input }) => {
      const registry = new BoundCtorRegistry(input)

      describe('should be derived class of BaseCtor', () => {
        const bindingCases = [
          {
            bindings: [
              FirstBindingKey,
              SecondBindingKey,
              ThirdBindingKey,
              FourthBindingKey,
            ],
          },
          {
            bindings: [
              SecondBindingKey,
              ThirdBindingKey,
              FourthBindingKey,
            ],
          },
          {
            bindings: [
              ThirdBindingKey,
              FourthBindingKey,
            ],
          },
          {
            bindings: [
              FourthBindingKey,
            ],
          },
          {
            bindings: [],
          },
        ]

        test.each(bindingCases)('bindings[0]: $input.bindings.0', ({ bindings }) => {
          const expected = {
            Ctor: input.BaseCtor,
          }

          const deriverSpy = jest.fn(({ Ctor }) => class extends Ctor {})

          const DerivedCtor = registry.ensureBoundCtor({
            bindings,
            deriver: deriverSpy,
          })

          const received = DerivedCtor.prototype

          expect(received)
            .toBeInstanceOf(input.BaseCtor)

          expect(deriverSpy)
            .toHaveBeenCalledWith(expected)
        })
      })
    })
  })
})

describe('BoundCtorRegistry', () => {
  describe('#declareBoundCtor()', () => {
    const cases = [
      {
        input: {
          BaseCtor: AlphaOrigin,
        },
      },
      {
        input: {
          BaseCtor: BetaOrigin,
        },
      },
    ]

    describe.each(cases)('BaseCtor: $input.BaseCtor', ({ input }) => {
      const registry = new BoundCtorRegistry(input)

      test('should be derived class of BaseCtor', () => {
        const deriver = ({ Ctor }) => class extends Ctor {}

        const DerivedClass = registry.declareBoundCtor({
          deriver,
        })
        const received = DerivedClass.prototype

        expect(received)
          .toBeInstanceOf(input.BaseCtor)
      })

      test('should call deriver() with BaseCtor', () => {
        const expected = {
          Ctor: input.BaseCtor,
        }

        const deriverSpy = jest.fn(({ Ctor }) => class extends Ctor {})

        registry.declareBoundCtor({
          deriver: deriverSpy,
        })

        expect(deriverSpy)
          .toHaveBeenCalledWith(expected)
      })

      test('should be the same class name with BaseCtor', () => {
        const expected = input.BaseCtor.name

        const deriver = ({ Ctor }) => class extends Ctor {}

        const DerivedClass = registry.declareBoundCtor({
          deriver,
        })
        const received = DerivedClass.name

        expect(received)
          .toBe(expected)
      })
    })
  })
})
