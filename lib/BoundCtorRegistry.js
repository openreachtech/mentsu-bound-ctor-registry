/**
 * Bound Ctor Registry.
 */
export default class BoundCtorRegistry {
  /**
   * @type {WeakMap<
   *   WeakKey,
   *   WeakMap<BoundCtor, BoundCtor>
   * >}
   */
  static BoundCtorPool = new WeakMap()

  /** @type {CompositeKeyPoolType} */
  static compositeKeyPool = new WeakMap()

  /**
   * Constructor of this class.
   *
   * @param {BoundCtorRegistryParams} params - Parameters of this class.
   */
  constructor ({
    BaseCtor,
  }) {
    this.BaseCtor = BaseCtor
  }

  /**
   * Factory method of this class.
   *
   * @template {X extends typeof BoundCtorRegistry ? X : never} T, X
   * @param {BoundCtorRegistryFactoryParams} params - Parameters of this method.
   * @returns {InstanceType<T>}
   * @this {T}
   */
  static create ({
    BaseCtor,
  }) {
    return /** @type {InstanceType<T>} */ (
      new this({
        BaseCtor,
      })
    )
  }

  /**
   * Ensure binding WeakMap key.
   *
   * @param {{
   *   bindings: Array<WeakKey | CompositeKeyPoolType<*, *>>
   * }} params - Parameters of this method.
   * @returns {WeakMap<*, *>} - Binding key as WeakMap.
   */
  static ensureBindingWeakMapKey ({
    bindings,
  }) {
    return /** @type {Array<CompositeKeyPoolType<*, *>>} */ (bindings)
      .reduce(
        (pool, it) => {
          const resolvedPool = pool.has(it)
            ? pool.get(it)
            : new WeakMap()

          pool.set(it, resolvedPool)

          return resolvedPool
        },
        this.compositeKeyPool
      )
  }

  /**
   * Ensure to get a constructor pool for a binding.
   *
   * @param {{
   *   weakMapKey: CompositeKeyPoolType<*, *>
   * }} params - Parameters for the method.
   * @returns {WeakMap<BoundCtor, BoundCtor>} Constructor pool for the binding.
   */
  static ensureCtorPool ({
    weakMapKey,
  }) {
    if (this.BoundCtorPool.has(weakMapKey)) {
      return /** @type {WeakMap<BoundCtor, BoundCtor>} */ (
        this.BoundCtorPool.get(weakMapKey)
      )
    }

    const CtorPool = new WeakMap()
    this.BoundCtorPool.set(weakMapKey, CtorPool)

    return CtorPool
  }

  /**
   * get: Constructor.
   *
   * @returns {typeof BoundCtorRegistry} Constructor of this class.
   */
  get Ctor () {
    return /** @type {typeof BoundCtorRegistry} */ (this.constructor)
  }

  /**
   * Ensure to get a bound constructor.
   *
   * @param {{
   *   bindings: Array<*>
   *   deriver: DeriverHandler
   * }} params - Parameters for the method.
   * @returns {BoundCtor} Bound constructor.
   * @public
   */
  ensureBoundCtor ({
    bindings,
    deriver,
  }) {
    const weakMapKey = this.Ctor.ensureBindingWeakMapKey({
      bindings,
    })

    const CtorPool = this.Ctor.ensureCtorPool({
      weakMapKey,
    })

    if (CtorPool.has(this.BaseCtor)) {
      return /** @type {BoundCtor} */ (
        CtorPool.get(this.BaseCtor)
      )
    }

    const BoundCtor = this.declareBoundCtor({
      deriver,
    })
    CtorPool.set(this.BaseCtor, BoundCtor)

    return BoundCtor
  }

  /**
   * Declare a bound constructor.
   *
   * @param {{
   *   deriver: DeriverHandler
   * }} params - Parameters.
   * @returns {BoundCtor} Declared bound constructor.
   */
  declareBoundCtor ({
    deriver,
  }) {
    const BoundCtor = deriver({
      Ctor: this.BaseCtor,
    })

    return {
      [this.BaseCtor.name]: class extends BoundCtor {},
    }[this.BaseCtor.name]
  }
}

/**
 * @typedef {{
 *   BaseCtor: BoundCtor
 * }} BoundCtorRegistryParams
 */

/**
 * @typedef {BoundCtorRegistryParams} BoundCtorRegistryFactoryParams
 */

/**
 * @typedef {WeakMap<K, V>} CompositeKeyPoolType
 * @template {CompositeKeyPoolType<K, *>} [K = CompositeKeyPoolType<*, *>] - Key type.
 * @template {WeakMap<K, *> | CompositeKeyPoolType<K, *>} [V = WeakMap<K, *> | CompositeKeyPoolType<K, *>] - Value type.
 */

/**
 * @typedef {new (...args: Array<*>) => *} BoundCtor
 */

/**
 * @typedef {({ Ctor }: { Ctor: new (...args: Array<*>) => * }) => BoundCtor} DeriverHandler
 */
