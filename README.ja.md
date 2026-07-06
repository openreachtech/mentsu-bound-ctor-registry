# @openreachtech/mentsu-bound-ctor-registry

`BoundCtorRegistry` — *バインディング* と *ベースコンストラクター* の組み合わせをキーとして、
派生（バインド）されたコンストラクタークラスを生成・メモ化するレジストリです。

同じバインディングとベースコンストラクターの組み合わせに対しては、常に**同一のクラス参照**を返します。
そのため派生クラスは一度だけ宣言され、以降は再利用されます。
キャッシュはすべて `WeakMap` で構築されているため、キーとして使われるオブジェクトが不要になれば
エントリーもガベージコレクションの対象になります。

- [English README](./README.md)

## 目次

- [コンセプト](#コンセプト)
- [インストール](#インストール)
- [使い方](#使い方)
- [API](#api)
- [メモ化の仕組み](#メモ化の仕組み)
- [開発](#開発)
- [ライセンス](#ライセンス)

## コンセプト

実行時にベースクラスから *派生*（バインド）したクラスを組み立てたい場面があります。
たとえば追加のコンテキストを持たせたサブクラスなどで、同じ入力が与えられたときには
まったく同じ派生クラスを返してほしい、というケースです。

`BoundCtorRegistry` は、**deriver（派生関数）** の結果を次の 2 つに対してメモ化することで
これを実現します。

1. **`bindings`** — 派生を識別する `WeakKey` 値（オブジェクト・関数・クラス）の順序付き配列。
   同じ順序のバインディング列は、常に同じ内部キーへと解決されます。
2. **`BaseCtor`** — レジストリを生成する際に指定したベースコンストラクター。

同じ `bindings` と `BaseCtor` が与えられた場合、`ensureBoundCtor()` は新たに派生を行わず、
キャッシュされたクラスを返します。

## インストール

本パッケージは `@openreachtech` スコープで公開されています。

```sh
npm install @openreachtech/mentsu-bound-ctor-registry
```

ES モジュール（`"type": "module"`）です。ESM の `import` 構文でインポートしてください。

## 使い方

```js
import { BoundCtorRegistry } from '@openreachtech/mentsu-bound-ctor-registry'

// 派生元となるベースクラス。
class Document {}

// ベースコンストラクターに紐づくレジストリを生成する。
const registry = BoundCtorRegistry.create({
  BaseCtor: Document,
})

// bindings は派生を識別する WeakKey 値（オブジェクト・クラス）。
const TenantKey = class {}
const RoleKey = class {}

// deriver はベース Ctor を受け取り、バインド（派生）クラスを返す。
const deriver = ({ Ctor }) => class extends Ctor {}

// 初回呼び出しで派生し、キャッシュする。
const BoundA = registry.ensureBoundCtor({
  bindings: [TenantKey, RoleKey],
  deriver,
})

// 同じ bindings・同じベースコンストラクター → 同一のクラス参照。
const BoundB = registry.ensureBoundCtor({
  bindings: [TenantKey, RoleKey],
  deriver,
})

console.log(BoundA === BoundB) // true

// bindings が異なれば → 別の派生クラス。
const BoundC = registry.ensureBoundCtor({
  bindings: [TenantKey],
  deriver,
})

console.log(BoundA === BoundC) // false

// 派生クラスはベースクラスを継承し、クラス名も引き継ぐ。
console.log(BoundA.prototype instanceof Document) // true
console.log(BoundA.name) // 'Document'
```

## API

### `BoundCtorRegistry.create({ BaseCtor })`

静的ファクトリーメソッド。指定したベースコンストラクター用のレジストリインスタンスを新規生成します。

| パラメーター | 型         | 説明                             |
| ------------ | ---------- | -------------------------------- |
| `BaseCtor`   | `Function` | 派生元となるベースコンストラクター。 |

`BoundCtorRegistry`（またはサブクラス）のインスタンスを返します。

コンストラクターを直接使うこともできます: `new BoundCtorRegistry({ BaseCtor })`

### `registry.ensureBoundCtor({ bindings, deriver })`

主となるエントリーポイント。指定した `bindings` に対応するバインド済みコンストラクターを返します。
初回呼び出し時に派生・キャッシュし、以降はキャッシュされた参照を返します。

| パラメーター | 型                    | 説明                                                                                     |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------- |
| `bindings`   | `Array<WeakKey>`      | 派生を識別する順序付きキー。各要素は `WeakMap` のキーとして使用可能である必要があります。 |
| `deriver`    | `({ Ctor }) => Class` | キャッシュミス時のみ呼ばれます。`{ Ctor: BaseCtor }` を受け取り、派生クラスを返します。   |

バインド済みコンストラクター（`BaseCtor` のサブクラス）を返します。

### `registry.declareBoundCtor({ deriver })`

キャッシュに触れずに、新しいバインド済みコンストラクターを宣言します。
`deriver({ Ctor: BaseCtor })` を呼び出し、その結果を `BaseCtor.name` と同じ `name` を持つ
サブクラスでラップします。通常は `ensureBoundCtor()` を使用してください。本メソッドは
それが内部的に利用する低レベルの構成要素です。

### `registry.Ctor`

レジストリ自身のコンストラクター（`this.constructor`）を返すゲッター。
インスタンスから静的メンバーへアクセスしつつ、サブクラスにも対応するために内部的に使用されます。

### 静的メンバー

- `BoundCtorRegistry.BoundCtorPool` — 内部の複合キーから、派生クラスのプール
  `WeakMap<BaseCtor, BoundCtor>` へのマッピングを持つ `WeakMap`。
- `BoundCtorRegistry.compositeKeyPool` — `bindings` 配列を単一で安定した `WeakMap` 参照へ
  解決するために使われる、入れ子構造の `WeakMap` ツリー。
- `BoundCtorRegistry.ensureBindingWeakMapKey({ bindings })` — `bindings` を安定した複合キー
  （`WeakMap`）へ解決します。同じ順序のバインディング列は、常に同じ参照を返します。
- `BoundCtorRegistry.ensureCtorPool({ weakMapKey })` — 複合キーに紐づく
  `WeakMap<BaseCtor, BoundCtor>` プールを返します（無ければ生成します）。

## メモ化の仕組み

ルックアップは 2 段階で行われ、いずれも `WeakMap` に支えられています。

1. **`bindings` → 複合キー。**
   `ensureBindingWeakMapKey()` は、入れ子の `compositeKeyPool` に沿って `bindings` 配列を
   畳み込み、バインディング 1 つにつき `WeakMap` を 1 階層たどります。返される末端の
   `WeakMap` は安定しており、同じ順序のバインディング列は常にまったく同じ参照へ解決されます。

2. **複合キー + `BaseCtor` → バインド済みクラス。**
   この複合キーで `BoundCtorPool` を引き、`WeakMap<BaseCtor, BoundCtor>` を得ます。
   プールに `BaseCtor` のエントリーが既にあればそのキャッシュ済みクラスを返し、
   無ければ `deriver` を呼び出して結果を保存し、それを返します。

すべての階層が `WeakMap` であるため、キャッシュされた派生クラスがキーとなるオブジェクトを
生存させ続けることはありません。バインディングやベースコンストラクターがどこからも参照されなく
なれば、対応するキャッシュエントリーはガベージコレクションの対象になります。

> **注意:** `bindings` の各要素および `BaseCtor` は、`WeakMap` の有効なキー
> （オブジェクト・関数・クラス）である必要があります。プリミティブ値はバインディングとして
> 使用できません。

## 開発

```sh
# テストの実行（Jest, ESM モード）。
npm test

# コードのリント。
npm run lint   # エイリアス: npm run l
```

## ライセンス

UNLICENSED. Copyright © Open Reach Tech Inc. All rights reserved.
