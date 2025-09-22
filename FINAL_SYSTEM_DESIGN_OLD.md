# 有村昆の民泊塾 投資シミュレーションシステム - 最終設計書

## プロジェクト概要

**プロジェクト名:** 有村昆の民泊塾 投資シミュレーションシステム  
**目的:** 不動産投資のシミュレーション機能とLINE Bot統合による詳細結果配信  
**対象ユーザー:** 不動産投資に興味のある個人投資家  

## システム構成

### アーキテクチャ
```
[フロントエンド] → [Express.js API] → [PostgreSQL] → [LINE Bot API]
```

### 技術スタック
- **フロントエンド:** HTML, CSS, JavaScript (Vanilla)
- **バックエンド:** Node.js + Express.js
- **データベース:** PostgreSQL
- **デプロイ:** Railway
- **外部API:** LINE Messaging API, OpenAI API

## ファイル構成と機能

### 必須ファイル（本番環境で使用）

#### 1. `server.js` - メインサーバーアプリケーション
**機能:**
- Express.jsサーバーの起動
- 静的ファイル配信
- API エンドポイント提供
- LINE Bot統合
- PostgreSQL データベース接続

**重要な修正点:**
```javascript
// LINE登録ボタンのURL - 正しいLINE Bot IDを使用
const lineRegistrationUrl = `https://line.me/R/ti/p/@234zjfds`;
```

#### 2. `package.json` - Node.js依存関係とスクリプト
**機能:**
- 依存パッケージの定義
- 起動スクリプトの設定
- プロジェクトメタデータ

**重要な設定:**
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

#### 3. `public/` ディレクトリ - フロントエンドファイル
**機能:**
- HTML, CSS, JavaScript ファイル
- 投資シミュレーション UI
- ユーザーインタラクション

### 設計書・仕様書ファイル（管理用）

#### 4. `SYSTEM_DESIGN.md` - システム設計書
**目的:** システム全体の設計思想と構成を記録

#### 5. `SYSTEM_SPECIFICATION.md` - システム仕様書
**目的:** 機能要件と技術仕様を詳細に記録

#### 6. `README.md` - プロジェクト説明書
**目的:** プロジェクトの概要と使用方法を説明

### 設定ファイル（デプロイ用）

#### 7. `.gitignore` - Git除外設定
**目的:** 不要なファイルをGitから除外

#### 8. `railway.json` - Railway設定（オプション）
**目的:** Railwayデプロイメント設定

#### 9. `nixpacks.toml` - ビルド設定（オプション）
**目的:** Node.jsアプリケーションの正しいビルド設定

## 環境変数設定

### 必須環境変数
```
LINE_BOT_ID=@234zjfds
LINE_CHANNEL_ACCESS_TOKEN=[LINEチャンネルアクセストークン]
LINE_CHANNEL_SECRET=[LINEチャンネルシークレット]
LIFF_ID=[LIFF アプリケーションID]
DATABASE_URL=[PostgreSQLデータベースURL]
OPENAI_API_KEY=[OpenAI APIキー]
```

### 環境変数の役割
- **LINE_BOT_ID:** LINE登録ボタンのリンク先を決定（重要な修正対象）
- **LINE_CHANNEL_ACCESS_TOKEN:** LINE APIアクセス用
- **LINE_CHANNEL_SECRET:** LINE Webhook検証用
- **LIFF_ID:** LINE内ブラウザアプリ用
- **DATABASE_URL:** PostgreSQLデータベース接続用
- **OPENAI_API_KEY:** AI機能用（オプション）

## デプロイメント手順

### 1. GitHubリポジトリ準備
- リポジトリURL: https://github.com/Prorium/minpaku-line-bot-production
- 修正済みコードがプッシュ済み

### 2. Railway新プロジェクト作成
1. Railway管理画面にアクセス
2. "New Project" → "GitHub Repo" を選択
3. `Prorium/minpaku-line-bot-production` を選択
4. プロジェクト名: `minpaku-line-bot-production`

### 3. 環境変数設定
Railway管理画面で上記の必須環境変数を設定

### 4. PostgreSQLデータベース追加
Railway管理画面で PostgreSQL データベースを追加

### 5. ドメイン生成
Railway管理画面で公開ドメインを生成

## 重要な修正内容

### LINE Bot ID修正
**問題:** LINE登録ボタンが `@your-line-id` にリンクしていた  
**解決:** `@234zjfds` に修正済み  

**修正箇所:**
```javascript
// 修正前
const lineRegistrationUrl = `https://line.me/R/ti/p/@your-line-id`;

// 修正後
const lineRegistrationUrl = `https://line.me/R/ti/p/@234zjfds`;
```

### package.json修正
**問題:** 存在しない `complete-server.js` を起動しようとしていた  
**解決:** `server.js` を起動するように修正済み  

## テスト手順

### 1. 基本動作確認
1. アプリケーションにアクセス
2. シミュレーション実行
3. 結果画面でLINE登録ボタンを確認

### 2. LINE登録確認
1. LINE登録ボタンをクリック
2. 正しいLINE公式アカウント（@234zjfds）にリダイレクトされることを確認
3. 404エラーが発生しないことを確認

## トラブルシューティング

### よくある問題と解決策

#### 1. アプリケーションがクラッシュする
- 環境変数が正しく設定されているか確認
- PostgreSQLデータベースが追加されているか確認
- ログを確認してエラーの詳細を特定

#### 2. LINE登録ボタンが404エラーになる
- LINE_BOT_ID環境変数が `@234zjfds` に設定されているか確認
- コードが最新版にデプロイされているか確認

#### 3. デプロイが失敗する
- package.jsonのstartスクリプトが `node server.js` になっているか確認
- 必要なファイルがすべてリポジトリに含まれているか確認

## 保守・運用

### 定期的な確認事項
1. LINE Bot IDの正確性
2. 環境変数の有効性
3. データベース接続の安定性
4. アプリケーションの応答時間

### 更新手順
1. ローカルでコード修正
2. GitHubリポジトリにプッシュ
3. Railway自動デプロイ確認
4. 動作テスト実行

## セキュリティ考慮事項

### 機密情報管理
- 環境変数として機密情報を管理
- GitHubリポジトリには機密情報を含めない
- APIキーの定期的な更新

### アクセス制御
- Railway管理画面へのアクセス制限
- GitHubリポジトリの適切な権限設定

---

**最終更新日:** 2025年9月22日  
**バージョン:** 1.0  
**作成者:** Manus AI Agent  
