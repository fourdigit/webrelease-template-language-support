# WebRelease Template LSP - クイックスタート

このガイドでは、WebRelease Template LSPを5分で始める方法を説明します。

## 前提条件

- VS Code 1.75.0 以上
- Python 3.11 以上
- Node.js 18.0 以上

## 1分でセットアップ

### ステップ1: クローン

```bash
git clone <repository-url>
cd webrelease-lsp
```

### ステップ2: サーバーをセットアップ

```bash
cd server
python3 -m venv venv
source venv/bin/activate  # Linux/Mac or venv\Scripts\activate on Windows
pip install pygls
```

### ステップ3: クライアントをセットアップ

```bash
cd ../client
npm install
npm run compile
```

### ステップ4: VS Codeで実行

1. VS Code で `client` フォルダを開く
2. `F5` キーを押す
3. 新しいVS Codeウィンドウが開きます

## 使用例

### 例1: 基本的なテンプレート

`test.wr` ファイルを作成：

```html
<!DOCTYPE html>
<html>
<head>
    <title>%pageTitle()%</title>
</head>
<body>
    <h1>%pageTitle()%</h1>
    <p>%content%</p>
</body>
</html>
```

**結果**: エラーなし ✓

### 例2: 条件分岐

```html
<wr-if condition="isNotNull(email)">
    <wr-then>
        <a href="mailto:%email%">%email%</a>
    </wr-then>
    <wr-else>
        Email not provided
    </wr-else>
</wr-if>
```

**結果**: エラーなし ✓

### 例3: ループ

```html
<table>
<wr-for list="items" variable="item" count="i">
    <tr>
        <td>%i%</td>
        <td>%item.name%</td>
        <td>%item.price%</td>
    </tr>
</wr-for>
</table>
```

**結果**: エラーなし ✓

### 例4: エラー検出

```html
<wr-if condition="invalid syntax !!!">
    Content
</wr-if>
```

**結果**: 赤い波線でエラーを表示 ✗

```
Condition syntax error: Expected identifier at position 8
```

## コード補完

### タグ補完

`<wr-` と入力して `Ctrl+Space`:

```
<wr-if
<wr-for
<wr-switch
<wr-variable
...
```

### 関数補完

`%` と入力して `Ctrl+Space`:

```
%pageTitle()%
%isNotNull()%
%length()%
...
```

## ホバー情報

関数やタグにマウスをホバー：

```
%pageTitle()%
 ↑ ホバー → "Get the page title" が表示される
```

## よくある質問

### Q: ファイルの拡張子は？

A: `.wr` または `.wrt` を使用してください。

### Q: 構文チェックが動作しない

A: 以下を確認してください：
1. ファイルが保存されているか
2. 拡張子が `.wr` または `.wrt` であるか
3. LSPサーバーが起動しているか（出力ウィンドウで確認）

### Q: LSPサーバーが起動しない

A: 以下を実行してください：

```bash
cd server
source venv/bin/activate
python -m pip install pygls
```

### Q: 拡張機能を本番環境にインストールしたい

A: 以下を実行してください：

```bash
cd client
npm install -g vsce
vsce package
code --install-extension webrelease-template-lsp-0.1.0.vsix
```

## 次のステップ

- [詳細なドキュメント](README.md) を読む
- [インストール・セットアップガイド](INSTALLATION.md) を確認する
- [サンプルテンプレート](example.wr) を参照する

## トラブルシューティング

### LSPサーバーのログを確認

```bash
tail -f /tmp/webrelease-lsp.log
```

### VS Code の出力ウィンドウを確認

```
View > Output > WebRelease Template LSP
```

## サポート

問題が発生した場合は、GitHub の issues セクションで報告してください。

## ライセンス

MIT
