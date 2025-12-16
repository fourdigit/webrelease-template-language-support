# WebRelease Template Language Support for VS Code

VS Code向けのWebReleaseテンプレート言語のLanguage Service Protocol (LSP)実装です。構文チェック、バリデーション、コード補完機能を提供します。

## 機能

### 1. 構文チェック・バリデーション

- **式の検証**: `%...%` で囲まれた式の構文をチェック
- **タグの検証**: `<wr-*>` 拡張タグの妥当性をチェック
- **属性の検証**: タグ属性の正当性を確認
- **タグ閉鎖の検証**: 開閉タグのペアを確認

### 2. コード補完（IntelliSense）

- **拡張タグ補完**: `<wr-if`, `<wr-for` など
- **属性補完**: `condition=`, `list=`, `variable=` など
- **関数補完**: `pageTitle()`, `isNotNull()` など
- **要素補完**: テンプレートで定義された要素

### 3. ホバー情報

- 拡張タグのドキュメント表示
- 関数のシグネチャ表示
- 要素の型情報表示

### 4. 構文ハイライト

- キーワード、タグ、コメントの色分け
- 式と通常のHTMLの区別

## インストール

### 前提条件

- VS Code 1.75.0 以上
- Python 3.11 以上

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd webrelease-lsp
```

2. サーバーの依存関係をインストール
```bash
cd server
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
pip install pygls
```

3. クライアントの依存関係をインストール
```bash
cd ../client
npm install
```

4. 拡張機能をコンパイル
```bash
npm run compile
```

5. VS Codeで拡張機能をロード
- VS Codeで `F5` キーを押すか、`Run > Start Debugging` を選択

## 使用方法

### ファイルの関連付け

WebReleaseテンプレートファイルは以下の拡張子で自動的に認識されます：
- `.wr`
- `.wrt`

### 構文チェック

エディタを開くと、自動的に構文チェックが実行され、エラーや警告が表示されます。

### コード補完

- `<wr-` と入力すると拡張タグの補完候補が表示されます
- `%` と入力すると要素や関数の補完候補が表示されます
- `Ctrl+Space` で手動で補完メニューを表示できます

### ホバー情報

関数名やタグ名にマウスをホバーすると、ドキュメント情報が表示されます。

## プロジェクト構造

```
webrelease-lsp/
├── server/                 # LSPサーバー (Python)
│   ├── parser.py          # テンプレートパーサー
│   ├── lsp_server.py      # LSPサーバー実装
│   └── __main__.py        # エントリーポイント
├── client/                # VS Code拡張機能 (TypeScript)
│   ├── src/
│   │   └── extension.ts   # 拡張機能のメイン
│   ├── syntaxes/          # TextMate文法定義
│   ├── language-configuration.json
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 開発

### サーバーの開発

1. `server/` ディレクトリで仮想環境を有効化
```bash
cd server
source venv/bin/activate
```

2. パーサーをテスト
```bash
python test_parser.py
```

3. LSPサーバーを起動
```bash
python -m server
```

### クライアントの開発

1. `client/` ディレクトリで開発
```bash
cd client
npm run watch  # 自動コンパイル
```

2. VS Codeで `F5` キーを押してデバッグ開始

## サポートされるWebReleaseタグ

### 条件分岐
- `wr-if`, `wr-then`, `wr-else` - if-then-else条件分岐
- `wr-switch`, `wr-case`, `wr-default` - switch-case条件分岐
- `wr-conditional`, `wr-cond` - 条件判定

### ループ制御
- `wr-for` - 繰り返し処理
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

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を説明してください。

## サポート

問題が発生した場合は、GitHubのissueを作成してください。
