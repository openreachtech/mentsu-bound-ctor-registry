# Usage

```js
import { BoundCtorRegistry } from '@openreachtech/mentsu-bound-ctor-registry'

// The abstract base class. `get ConstraintCtor` must be overridden by a derived class.
// Its static `use` inflator method returns a bound subclass for the given constraint.
class OriginalCtor {
  /** @abstract */
  get ConstraintCtor () {
    throw new Error('undefined')
  }

  static use (ConstraintCtor) {
    // Create a registry bound to a base constructor.
    const registry = BoundCtorRegistry.create({
      BaseCtor: OriginalCtor,
    })

    return registry.ensureBoundCtor({
      bindings: [
        ConstraintCtor,
      ],
      deriver: ({ Ctor }) => class extends Ctor {
        get ConstraintCtor () {
          return ConstraintCtor
        }
      },
    })
  }
}

// The constructors to bind as the constraint.
const FirstConstraint = class {}
const SecondConstraint = class {}

// The same constraint resolves to the same bound class (cached).
const AlphaCtor = OriginalCtor.use(FirstConstraint)
const BetaCtor = OriginalCtor.use(FirstConstraint)

console.log(AlphaCtor === BetaCtor) // true

// A different constraint -> a different bound class.
const GammaCtor = OriginalCtor.use(SecondConstraint)

console.log(AlphaCtor === GammaCtor) // false

// The overridden getter returns the bound constraint instead of throwing.
console.log(new AlphaCtor().ConstraintCtor === FirstConstraint) // true
console.log(new GammaCtor().ConstraintCtor === SecondConstraint) // true

// The bound class extends the base, and keeps the base class name.
console.log(AlphaCtor.prototype instanceof OriginalCtor) // true
console.log(AlphaCtor.name) // 'OriginalCtor'
```

## Real-world example

In production, the inflator method is a static factory that binds its arguments and
returns a memoized subclass — overriding an abstract member on the derived class. For
example, `UnionScalar.of(...schemas)` from a scalar-schema library:

```js
import {
  BoundCtorRegistry,
} from '@openreachtech/mentsu-bound-ctor-registry'

export default class UnionScalar extends BaseScalar {
  // Inflator method: binds the schemas and returns a memoized subclass.
  static of (...schemas) {
    const registry = BoundCtorRegistry.create({
      BaseCtor: this,
    })

    return registry.ensureBoundCtor({
      bindings: schemas,
      deriver: ({ Ctor }) => class extends Ctor {
        /** @override */
        static get boundSchemas () {
          return schemas
        }
      },
    })
  }

  // `from` simply delegates to `of`.
  static from (schemas) {
    return this.of(...schemas)
  }

  // Abstract member overridden by the bound subclass above.
  /** @abstract */
  static get boundSchemas () {
    throw new Error('UnionScalar.get:boundSchemas must be inherited')
  }
}
```

Because the bound subclass is memoized by its `bindings` (here the `schemas`),
`UnionScalar.of(A, B) === UnionScalar.of(A, B)` — the derived class is declared once and
reused for the same schemas.

## Conventions

In real applications, it is recommended to define the inflator method as a static member
of the class being bound (as `OriginalCtor.use()` and `UnionScalar.of()` above).

By convention, inflator methods are given short, preposition-like names such as:

- `.as()`
- `.use()`
- `.from()`
- `.of()`
- `.each()`
- `.via()`
- `.to()`
- `.by()`

The reason is that a call such as `Document.as(bindingSchema)` reads declaratively.
`.to()` expresses the intent of binding a Converter class; when there is more than one
Converter class, add an object suffix — e.g. `.toKey()`, `.toValue()` — to distinguish
them.
