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
- [コントリビューション](#コントリビューション)
- [ライセンス](#ライセンス)
- [開発者](#開発者)
- [著作権](#著作権)

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

Node.js 20.x が必要です（CI がビルド対象とするバージョン）。

本パッケージは GitHub Packages（`@openreachtech` スコープ）で公開されています。インストールする前に、以下の二項が必要です。

1. `.npmrc` にレジストリを追記する:

   ```
   @openreachtech:registry=https://npm.pkg.github.com
   ```

2. `npm login` で認証する:

   ```sh
   npm login --registry https://npm.pkg.github.com
   ```

設定後、インストールします:

```sh
npm install @openreachtech/mentsu-bound-ctor-registry
```

ES モジュール（`"type": "module"`）です。ESM の `import` 構文でインポートしてください。

## 使い方

使い方の例（`use` inflator method、および inflator method の実例を含む）は
[readme/usage.ja.md](https://github.com/openreachtech/mentsu-bound-ctor-registry/blob/main/readme/usage.ja.md)
を参照してください。

## API

クラスメンバーは以下の表記に従って記述します。

| notation | members |
| :-- | :-- |
| `#instanceProperty` | instance property |
| `#instanceMethod()` | instance method |
| `#get:instanceGetter` | instance getter |
| `#set:instanceSetter` | instance setter |
| `.staticProperty` | static property |
| `.staticMethod()` | static method |
| `.get:staticGetter` | static getter |
| `.set:staticSetter` | static setter |

### `.create({ BaseCtor })`

静的ファクトリーメソッド。指定したベースコンストラクター用のレジストリインスタンスを新規生成します。

| パラメーター | 型         | 説明                             |
| ------------ | ---------- | -------------------------------- |
| `BaseCtor`   | `new (...args: Array<*>) => *` | 派生元となるベースコンストラクター。 |

`BoundCtorRegistry`（またはサブクラス）のインスタンスを返します。

コンストラクターを直接使うこともできます: `new BoundCtorRegistry({ BaseCtor })`

### `#ensureBoundCtor({ bindings, deriver })`

主となるエントリーポイント。指定した `bindings` に対応するバインド済みコンストラクターを返します。
初回呼び出し時に派生・キャッシュし、以降はキャッシュされた参照を返します。

| パラメーター | 型                    | 説明                                                                                     |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------- |
| `bindings`   | `Array<WeakKey>`      | 派生を識別する順序付きキー。各要素は `WeakMap` のキーとして使用可能である必要があります。 |
| `deriver`    | `({ Ctor }) => new (...args: Array<*>) => *` | キャッシュミス時のみ呼ばれます。`{ Ctor: BaseCtor }` を受け取り、派生クラスを返します。   |

バインド済みコンストラクター（`BaseCtor` のサブクラス）を返します。

## メモ化の仕組み

バインド済みクラスは、`bindings` と `BaseCtor` の組み合わせに対してキャッシュされます。

1. 順序付きの `bindings` 配列は、単一で安定したキャッシュキーへ解決されます。同じ順序の
   バインディング列は、常に同じキーへ解決されます。
2. そのキーと `BaseCtor` の組み合わせによって、キャッシュ済みのバインド済みクラスが特定
   されます。初回のリクエストでは `deriver` が呼び出されて結果が保存され、以降は同じ入力の
   リクエストに対して保存済みのクラスが返されます。

キャッシュは `WeakMap` で構築されているため、キャッシュされた派生クラスがキーとなる
オブジェクトを生存させ続けることはありません。バインディングやベースコンストラクターが
どこからも参照されなくなれば、対応するキャッシュエントリーはガベージコレクションの対象に
なります。

> **注意:** `bindings` の各要素および `BaseCtor` は、`WeakMap` の有効なキー
> （オブジェクト・関数・クラス）である必要があります。プリミティブ値はバインディングとして
> 使用できません。

## コントリビューション

バグ報告・機能要望・コード貢献を歓迎します。

GitHub Issues からお気軽にご連絡ください。

```sh
git clone https://github.com/openreachtech/mentsu-bound-ctor-registry.git
cd mentsu-bound-ctor-registry
npm install
npm run lint
npm test
```

## ライセンス

本プロジェクトは Apache License 2.0 で公開されています。

詳細は [LICENSE ファイル](./LICENSE) を参照してください。

## 開発者

[Open Reach Tech Inc.](https://openreach.tech)

## 著作権

© 2026 Open Reach Tech Inc.
