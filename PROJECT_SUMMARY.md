# WebRelease Template LSP - プロジェクトサマリー

## プロジェクト概要

WebRelease Template向けのLanguage Service Protocol (LSP)実装です。VS Codeで構文チェック・バリデーション、コード補完機能を提供します。

## 実装内容

### 1. LSPサーバー（Python）

**ファイル**: `server/parser.py`, `server/lsp_server.py`, `server/__main__.py`

**機能**:
- WebReleaseテンプレート言語のパーサー実装
- 式の構文検証（`%...%` で囲まれた式）
- 拡張タグの妥当性チェック（`<wr-*>` タグ）
- タグ属性の検証
- タグ開閉の検証
- コード補完候補の生成
- ホバー情報の提供

**技術スタック**:
- Python 3.11
- pygls（Python Language Server）
- 正規表現ベースのパーサー

### 2. VS Code拡張機能（TypeScript）

**ファイル**: `client/src/extension.ts`, `client/syntaxes/webrelease.tmLanguage.json`

**機能**:
- LSPクライアント実装
- 言語設定
- TextMate文法定義（構文ハイライト）
- LSPサーバーとの通信

**技術スタック**:
- TypeScript 4.8
- vscode-languageclient
- TextMate文法

### 3. テスト・ドキュメント

**ファイル**: `integration_test.py`, `test_parser.py`, `example.wr`

**テストカバレッジ**:
- 基本的なテンプレート検証
- wr-forループ検証
- 無効なタグ検出
- 未閉じタグ検出
- ネストされたタグ検証
- wr-switchケース検証
- コメント処理
- グループ要素アクセス

## サポートされるWebReleaseタグ

### 条件分岐
- `wr-if`, `wr-then`, `wr-else` - if-then-else条件分岐
- `wr-switch`, `wr-case`, `wr-default` - switch-case条件分岐
- `wr-conditional`, `wr-cond` - 条件判定

### ループ制御
- `wr-for` - 繰り返し処理（list/string/times形式）
- `wr-break` - ループの途中で脱出

### 変数操作
- `wr-variable` - 変数定義
- `wr-append` - 変数に値を追加
- `wr-clear` - 変数の値をクリア

### その他
- `wr-return` - メソッド内で値を返す
- `wr-error` - エラーチェック
- `wr-comment` - コメント

## サポートされる関数

### 日時関数
- `pageTitle()` - ページタイトルを取得
- `currentTime()` - 現在時刻を取得
- `formatDate(time, format)` - 日付をフォーマット

### NULL チェック関数
- `isNull(value)` - NULL かチェック
- `isNotNull(value)` - NULL でないかチェック
- `isNumber(value)` - 数値かチェック

### 型変換関数
- `number(value)` - 数値に変換
- `string(value)` - 文字列に変換

### 文字列関数
- `length(str)` - 文字列長を取得
- `substring(str, start, end)` - 部分文字列を取得
- `indexOf(str, substr)` - 部分文字列の位置を検索
- `contains(str, substr)` - 部分文字列を含むかチェック
- `startsWith(str, prefix)` - 指定の文字列で始まるかチェック
- `endsWith(str, suffix)` - 指定の文字列で終わるかチェック
- `toUpperCase(str)` - 大文字に変換
- `toLowerCase(str)` - 小文字に変換
- `trim(str)` - 前後の空白を削除
- `replace(str, from, to)` - テキストを置換
- `split(str, delimiter)` - 文字列を分割
- `join(array, delimiter)` - 配列を結合

### 数値関数
- `round(num)` - 四捨五入
- `floor(num)` - 床関数
- `ceil(num)` - 天井関数
- `abs(num)` - 絶対値
- `min(a, b)` - 最小値
- `max(a, b)` - 最大値
- `divide(a, b, scale, mode)` - 除算
- `setScale(num, scale)` - 小数点以下の桁数を設定

## プロジェクト構造

```
webrelease-lsp/
├── server/                           # LSPサーバー (Python)
│   ├── parser.py                    # テンプレートパーサー
│   ├── lsp_server.py                # LSPサーバー実装
│   ├── __main__.py                  # エントリーポイント
│   ├── test_parser.py               # パーサーテスト
│   └── venv/                        # Python仮想環境
│
├── client/                           # VS Code拡張機能 (TypeScript)
│   ├── src/
│   │   └── extension.ts             # 拡張機能のメイン
│   ├── syntaxes/
│   │   └── webrelease.tmLanguage.json  # TextMate文法定義
│   ├── language-configuration.json  # 言語設定
│   ├── package.json                 # npm設定
│   ├── tsconfig.json                # TypeScript設定
│   ├── .eslintrc.json               # ESLint設定
│   └── node_modules/                # npm依存パッケージ
│
├── README.md                         # メインドキュメント
├── INSTALLATION.md                   # インストール・セットアップガイド
├── QUICKSTART.md                     # クイックスタート
├── PROJECT_SUMMARY.md                # このファイル
├── example.wr                        # サンプルテンプレート
├── integration_test.py               # 統合テスト
└── .gitignore                        # Git設定
```

## インストール・使用方法

### クイックスタート

```bash
# 1. クローン
git clone <repository-url>
cd webrelease-lsp

# 2. サーバーセットアップ
cd server
python3 -m venv venv
source venv/bin/activate
pip install pygls

# 3. クライアントセットアップ
cd ../client
npm install
npm run compile

# 4. VS Codeで実行
# client フォルダを開いて F5 キーを押す
```

詳細は [INSTALLATION.md](INSTALLATION.md) と [QUICKSTART.md](QUICKSTART.md) を参照してください。

## 機能一覧

### 構文チェック・バリデーション
- ✓ 式の構文チェック
- ✓ タグの妥当性チェック
- ✓ 属性の検証
- ✓ タグ開閉の検証
- ✓ 条件式の構文チェック

### コード補完
- ✓ 拡張タグ補完
- ✓ 属性補完
- ✓ 関数補完
- ✓ 要素補完

### ホバー情報
- ✓ タグのドキュメント表示
- ✓ 関数のシグネチャ表示
- ✓ 要素の型情報表示

### 構文ハイライト
- ✓ キーワードハイライト
- ✓ タグハイライト
- ✓ コメントハイライト
- ✓ 式のハイライト

## テスト結果

統合テストスイート（10テストケース）の実行結果：

| テストケース | 結果 |
|-------------|------|
| 基本的なテンプレート検証 | ✓ PASSED |
| wr-forループ検証 | ✓ PASSED |
| 無効なタグ検出 | ✓ PASSED |
| 未閉じタグ検出 | ✓ PASSED |
| 複雑な式の検証 | ✓ PASSED |
| 無効な条件式 | ✓ PASSED |
| ネストされたタグ検証 | ✓ PASSED |
| wr-switch検証 | ✓ PASSED |
| コメント処理 | ✓ PASSED |
| グループ要素アクセス | ✓ PASSED |

## 今後の拡張可能性

### 短期的な改善
- [ ] フォーマッター機能の追加
- [ ] リファクタリング支援機能
- [ ] 定義へのジャンプ機能
- [ ] 参照の検索機能

### 中期的な改善
- [ ] デバッガーの実装
- [ ] テンプレートプレビュー機能
- [ ] 複数ファイルのサポート
- [ ] 型推論機能の強化

### 長期的な改善
- [ ] 言語サーバーのパフォーマンス最適化
- [ ] キャッシング機構の実装
- [ ] 並列処理のサポート
- [ ] 他のエディタ（Vim、Emacs等）への対応

## 技術的な特徴

### パーサー設計
- **正規表現ベース**: シンプルで保守性が高い
- **再帰下降パーサー**: 式の構文解析に使用
- **スタックベース**: タグの開閉検証に使用

### LSP実装
- **非同期処理**: 大規模ファイルでもレスポンスが良い
- **段階的な検証**: ファイル変更時に自動的に検証
- **診断情報の発行**: エラー・警告を即座に表示

### VS Code統合
- **TextMate文法**: 標準的な構文ハイライト
- **LSPクライアント**: 標準的なLSP通信
- **拡張機能API**: VS Code標準の拡張機能API

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を説明してください。

## サポート

問題が発生した場合は、GitHub の issues セクションで報告してください。以下の情報を含めてください：

1. VS Code のバージョン
2. Python のバージョン
3. エラーメッセージ（完全なテキスト）
4. 再現手順
5. `/tmp/webrelease-lsp.log` のログ出力

## 開発者

WebRelease Template LSP は、WebReleaseテンプレート言語の開発者体験を向上させるために開発されました。

## 謝辞

- [pygls](https://github.com/python-lsp/python-lsp-server) - Python LSP実装
- [VS Code Language Server Protocol](https://microsoft.github.io/language-server-protocol/) - LSP仕様
- [WebRelease](https://www.frameworks.co.jp/) - テンプレート言語仕様

---

**最終更新**: 2025年12月16日
**バージョン**: 0.1.0
