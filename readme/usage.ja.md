# 使い方

```js
import { BoundCtorRegistry } from '@openreachtech/mentsu-bound-ctor-registry'

// 抽象ベースクラス。`get ConstraintCtor` は派生クラスで上書きする必要がある。
// 静的な `use` インフレーターメソッドが、指定した制約に対するバインド済みサブクラスを返す。
class OriginalCtor {
  /** @abstract */
  get ConstraintCtor () {
    throw new Error('undefined')
  }

  static use (ConstraintCtor) {
    // ベースコンストラクターに紐づくレジストリを生成する。
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

// バインドする制約コンストラクター。
const FirstConstraint = class {}
const SecondConstraint = class {}

// 同じ制約は同じバインド済みクラスへ解決される（キャッシュ）。
const AlphaCtor = OriginalCtor.use(FirstConstraint)
const BetaCtor = OriginalCtor.use(FirstConstraint)

console.log(AlphaCtor === BetaCtor) // true

// 制約が異なれば → 別のバインド済みクラス。
const GammaCtor = OriginalCtor.use(SecondConstraint)

console.log(AlphaCtor === GammaCtor) // false

// 上書きされたゲッターは、throw せずにバインドされた制約を返す。
console.log(new AlphaCtor().ConstraintCtor === FirstConstraint) // true
console.log(new GammaCtor().ConstraintCtor === SecondConstraint) // true

// 派生クラスはベースクラスを継承し、クラス名も引き継ぐ。
console.log(AlphaCtor.prototype instanceof OriginalCtor) // true
console.log(AlphaCtor.name) // 'OriginalCtor'
```

## 実際のクラスでの例

実際のコードでは、inflator method は引数をバインドしてメモ化されたサブクラスを返す静的
ファクトリーであり、派生クラス側で抽象メンバーを上書きします。例として、スカラースキーマ系
ライブラリの `UnionScalar.of(...schemas)`:

```js
import {
  BoundCtorRegistry,
} from '@openreachtech/mentsu-bound-ctor-registry'

export default class UnionScalar extends BaseScalar {
  // inflator method: schemas をバインドしてメモ化されたサブクラスを返す。
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

  // `from` は単に `of` に委譲する。
  static from (schemas) {
    return this.of(...schemas)
  }

  // 上のバインド済みサブクラスで上書きされる抽象メンバー。
  /** @abstract */
  static get boundSchemas () {
    throw new Error('UnionScalar.get:boundSchemas must be inherited')
  }
}
```

バインド済みサブクラスは `bindings`（ここでは `schemas`）でメモ化されるため、
`UnionScalar.of(A, B) === UnionScalar.of(A, B)` となり、同じ schemas に対して派生クラスは
一度だけ宣言され再利用されます。

## 慣習

実際のアプリケーションでは、binding するクラスに inflator method を static メンバーとして
定義するのが推奨です（上記の `OriginalCtor.use()` や `UnionScalar.of()` のように）。

inflator method には、慣習的に前置詞のような短い名前を付けます:

- `.as()`
- `.use()`
- `.from()`
- `.of()`
- `.each()`
- `.via()`
- `.to()`
- `.by()`

これは、`Document.as(bindingSchema)` のように記述したときに、定義名が宣言的に読めるように
するためです。`.to()` は「Converter クラスをバインドする」意図で使いますが、Converter クラスが
複数ある場合は `.toKey()`, `.toValue()` のように目的語を付与して区分します。
