# @openreachtech/mentsu-bound-ctor-registry

`BoundCtorRegistry` — a registry that derives and memoizes bound constructor classes,
keyed by a composite of *bindings* and a *base constructor*.

For the same combination of bindings and base constructor it always returns the
**identical class reference**, so a derived class is declared only once and then reused.
The cache is built entirely on `WeakMap`, so entries are garbage-collected together with
the objects used as keys.

- [Japanese README (日本語)](./README.ja.md)

## Table of contents

- [Concept](#concept)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [How memoization works](#how-memoization-works)
- [Development](#development)
- [License](#license)

## Concept

Sometimes you need to build a *derived* (bound) class from a base class at runtime — for
example a subclass that carries extra context — and you want the exact same derived class
back whenever the same inputs are given again.

`BoundCtorRegistry` solves this by memoizing the result of a **deriver** function against
two things:

1. **`bindings`** — an ordered array of `WeakKey` values (objects / functions / classes)
   that identifies the derivation. The same sequence of bindings always resolves to the
   same internal key.
2. **`BaseCtor`** — the base constructor the registry was created for.

Given the same `bindings` + `BaseCtor`, `ensureBoundCtor()` returns the cached class
instead of deriving a new one.

## Installation

This package is published under the `@openreachtech` scope.

```sh
npm install @openreachtech/mentsu-bound-ctor-registry
```

It is an ES module (`"type": "module"`); import it with ESM `import` syntax.

## Usage

```js
import { BoundCtorRegistry } from '@openreachtech/mentsu-bound-ctor-registry'

// The base class you want to derive from.
class Document {}

// Create a registry bound to a base constructor.
const registry = BoundCtorRegistry.create({
  BaseCtor: Document,
})

// Bindings are WeakKey values (objects / classes) that identify the derivation.
const TenantKey = class {}
const RoleKey = class {}

// A deriver receives the base Ctor and returns a bound (derived) class.
const deriver = ({ Ctor }) => class extends Ctor {}

// First call derives and caches the bound class.
const BoundA = registry.ensureBoundCtor({
  bindings: [TenantKey, RoleKey],
  deriver,
})

// Same bindings + same base constructor -> same class reference.
const BoundB = registry.ensureBoundCtor({
  bindings: [TenantKey, RoleKey],
  deriver,
})

console.log(BoundA === BoundB) // true

// Different bindings -> a different bound class.
const BoundC = registry.ensureBoundCtor({
  bindings: [TenantKey],
  deriver,
})

console.log(BoundA === BoundC) // false

// The bound class extends the base, and keeps the base class name.
console.log(BoundA.prototype instanceof Document) // true
console.log(BoundA.name) // 'Document'
```

## API

### `BoundCtorRegistry.create({ BaseCtor })`

Static factory method. Returns a new registry instance for the given base constructor.

| Parameter  | Type       | Description                            |
| ---------- | ---------- | -------------------------------------- |
| `BaseCtor` | `Function` | The base constructor to derive from.   |

Returns an instance of `BoundCtorRegistry` (or of the calling subclass).

You may also use the constructor directly: `new BoundCtorRegistry({ BaseCtor })`.

### `registry.ensureBoundCtor({ bindings, deriver })`

The main entry point. Returns the bound constructor for the given `bindings`, deriving and
caching it on the first call and returning the cached reference afterwards.

| Parameter  | Type                  | Description                                                                                     |
| ---------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| `bindings` | `Array<WeakKey>`      | Ordered keys that identify the derivation. Each element must be usable as a `WeakMap` key.       |
| `deriver`  | `({ Ctor }) => Class` | Called only on a cache miss. Receives `{ Ctor: BaseCtor }` and must return a derived class.      |

Returns the bound constructor (a subclass of `BaseCtor`).

### `registry.declareBoundCtor({ deriver })`

Declares a fresh bound constructor without touching the cache. Calls
`deriver({ Ctor: BaseCtor })`, then wraps the result in a subclass whose `name` matches
`BaseCtor.name`. Normally you use `ensureBoundCtor()` instead; this is the lower-level
building block it relies on.

### `registry.Ctor`

Getter returning the registry's own constructor (`this.constructor`). Used internally to
reach the static members from an instance while staying subclass-friendly.

### Static members

- `BoundCtorRegistry.BoundCtorPool` — a `WeakMap` from an internal composite key to a
  `WeakMap<BaseCtor, BoundCtor>` pool of derived classes.
- `BoundCtorRegistry.compositeKeyPool` — a nested `WeakMap` tree used to resolve an array
  of `bindings` down to a single, stable `WeakMap` reference.
- `BoundCtorRegistry.ensureBindingWeakMapKey({ bindings })` — resolves `bindings` to the
  stable composite key (a `WeakMap`). The same sequence of bindings always yields the same
  reference.
- `BoundCtorRegistry.ensureCtorPool({ weakMapKey })` — returns (creating if needed) the
  `WeakMap<BaseCtor, BoundCtor>` pool associated with a composite key.

## How memoization works

The lookup happens in two stages, both backed by `WeakMap`:

1. **`bindings` → composite key.**
   `ensureBindingWeakMapKey()` folds the `bindings` array through the nested
   `compositeKeyPool`, walking one `WeakMap` level per binding. The leaf `WeakMap` it
   returns is stable: the same ordered sequence of bindings always resolves to the exact
   same reference.

2. **composite key + `BaseCtor` → bound class.**
   That composite key indexes `BoundCtorPool` to get a `WeakMap<BaseCtor, BoundCtor>`.
   If the pool already holds an entry for `BaseCtor`, the cached class is returned;
   otherwise `deriver` is invoked, the result is stored, and then returned.

Because every layer is a `WeakMap`, cached derived classes do not keep their key objects
alive: once the bindings or the base constructor are no longer referenced elsewhere, the
corresponding cache entries become eligible for garbage collection.

> **Note:** every element of `bindings`, and the `BaseCtor`, must be a valid `WeakMap`
> key (an object, function, or class). Primitive values cannot be used as bindings.

## Development

```sh
# Run the test suite (Jest, ESM mode).
npm test

# Lint the codebase.
npm run lint   # alias: npm run l
```

## License

UNLICENSED. Copyright © Open Reach Tech Inc. All rights reserved.
