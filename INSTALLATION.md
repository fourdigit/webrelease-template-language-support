# WebRelease Template LSP - インストール・セットアップガイド

## 前提条件

- **VS Code**: 1.75.0 以上
- **Python**: 3.11 以上
- **Node.js**: 18.0 以上（拡張機能のコンパイル用）
- **npm**: 9.0 以上

## インストール手順

### ステップ1: リポジトリをクローン

```bash
git clone <repository-url>
cd webrelease-lsp
```

### ステップ2: サーバーの環境構築

```bash
cd server

# 仮想環境を作成
python3 -m venv venv

# 仮想環境を有効化
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows

# 依存パッケージをインストール
pip install pygls
```

### ステップ3: クライアント（VS Code拡張機能）の環境構築

```bash
cd ../client

# 依存パッケージをインストール
npm install

# TypeScriptをコンパイル
npm run compile
```

### ステップ4: VS Codeで拡張機能をロード

#### 方法1: デバッグモードで実行

1. VS Codeでプロジェクトフォルダを開く
2. `client` フォルダを VS Code のワークスペースルートにする
3. `F5` キーを押すか、`Run > Start Debugging` を選択
4. 新しいVS Codeウィンドウが開き、拡張機能がロードされます

#### 方法2: 拡張機能をパッケージ化してインストール

```bash
cd client

# vsce をグローバルインストール
npm install -g vsce

# 拡張機能をパッケージ化
vsce package

# VS Code で拡張機能をインストール
# 生成された .vsix ファイルを VS Code にドラッグ&ドロップ
# または
code --install-extension webrelease-template-lsp-0.1.0.vsix
```

## 使用方法

### ファイルの関連付け

WebReleaseテンプレートファイルは以下の拡張子で自動的に認識されます：
- `.wr`
- `.wrt`

ファイルを開くと、自動的にWebRelease Template言語がアクティブになります。

### 構文チェック

エディタを開くと、自動的に構文チェックが実行されます：
- **赤い波線**: エラー（構文エラー、未閉じタグなど）
- **黄色い波線**: 警告（不正な属性など）

### コード補完

#### 拡張タグの補完

```
<wr-
```

と入力すると、利用可能な拡張タグの補完候補が表示されます：
- `wr-if`
- `wr-for`
- `wr-switch`
- など

#### 式の補完

```
%
```

と入力すると、関数や要素の補完候補が表示されます：
- 関数: `pageTitle()`, `isNotNull()`, など
- 要素: テンプレートで定義された要素名

#### 手動補完

`Ctrl+Space` で手動で補完メニューを表示できます。

### ホバー情報

関数名やタグ名にマウスをホバーすると、ドキュメント情報が表示されます：

```
%pageTitle()%
 ↑ ここにホバー → "Get the page title" が表示される
```

## トラブルシューティング

### LSPサーバーが起動しない

**症状**: "WebRelease Template LSP server not found" というエラーが表示される

**解決方法**:
1. サーバーのパスが正しいか確認
2. Python 3.11 以上がインストールされているか確認
3. `pygls` がインストールされているか確認

```bash
cd server
source venv/bin/activate
python -m pip list | grep pygls
```

### 拡張機能がロードされない

**症状**: WebRelease Template言語が認識されない

**解決方法**:
1. ファイルの拡張子が `.wr` または `.wrt` であることを確認
2. VS Code を再起動
3. 拡張機能のアクティビティログを確認

```
View > Output > WebRelease Template LSP
```

### 構文チェックが動作しない

**症状**: エラーが表示されない

**解決方法**:
1. ファイルが正しく保存されているか確認
2. 出力ウィンドウでエラーメッセージを確認
3. LSPサーバーのログを確認

```
tail -f /tmp/webrelease-lsp.log
```

## 開発

### サーバーの開発

```bash
cd server
source venv/bin/activate

# パーサーをテスト
python test_parser.py

# 統合テストを実行
cd ..
python integration_test.py
```

### クライアントの開発

```bash
cd client

# 自動コンパイルモード
npm run watch

# ESLint でコードをチェック
npm run lint
```

## 設定

### VS Code 設定

`settings.json` に以下の設定を追加することで、LSPの動作をカスタマイズできます：

```json
{
  "[webrelease]": {
    "editor.defaultFormatter": "webrelease.webrelease-template-lsp",
    "editor.formatOnSave": true
  },
  "webrelease.lsp.pythonPath": "/path/to/python3",
  "webrelease.lsp.serverPath": "/path/to/server"
}
```

## ログ出力

LSPサーバーのログは以下の場所に出力されます：

- **Linux/Mac**: `/tmp/webrelease-lsp.log`
- **Windows**: `C:\Temp\webrelease-lsp.log`

ログレベルを変更するには、`server/lsp_server.py` の `logging.basicConfig` を編集してください。

## サポート

問題が発生した場合は、以下の情報を含めてissueを作成してください：

1. VS Code のバージョン
2. Python のバージョン
3. エラーメッセージ（完全なテキスト）
4. 再現手順
5. `/tmp/webrelease-lsp.log` のログ出力

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を説明してください。
