# 有村昆の民泊塾 - 民泊投資収益シミュレーター システム設計書

## 1. システム概要

### 1.1 プロジェクト名
**有村昆の民泊塾 - 民泊投資収益シミュレーター**

### 1.2 目的
民泊投資の収益性を簡単にシミュレーションできるWebアプリケーションを提供し、ユーザーがLINE Botを通じて詳細な投資分析結果を受け取れるシステム。

### 1.3 主要機能
- 5ステップの投資シミュレーション
- 地域・物件タイプ別の収益計算
- LINE Bot連携による詳細分析結果の配信
- レスポンシブWebデザイン

## 2. システム構成

### 2.1 技術スタック

| 層 | 技術 | 詳細 |
|---|---|---|
| **フロントエンド** | HTML/CSS/JavaScript | レスポンシブデザイン、SPA風UI |
| **バックエンド** | Node.js + Express | RESTful API、静的ファイル配信 |
| **データベース** | PostgreSQL | ユーザーデータ、シミュレーション結果保存 |
| **外部API** | LINE Messaging API | Bot機能、メッセージ送信 |
| **外部API** | OpenAI API | 詳細分析レポート生成 |
| **デプロイ** | Railway | クラウドホスティング |

### 2.2 システム構成図
```
[ユーザー] ↔ [Webブラウザ] ↔ [Railway] ↔ [Node.js/Express]
                                              ↓
                                         [PostgreSQL]
                                              ↓
                                    [LINE Messaging API]
                                              ↓
                                         [OpenAI API]
```

## 3. データベース設計

### 3.1 テーブル構造

#### simulations テーブル
| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | SERIAL | PRIMARY KEY | シミュレーションID |
| region | VARCHAR(50) | NOT NULL | 地域 |
| property_type | VARCHAR(20) | NOT NULL | 物件タイプ |
| monthly_rent | INTEGER | NOT NULL | 月額家賃 |
| initial_cost | INTEGER | NOT NULL | 初期費用 |
| furniture_cost | INTEGER | DEFAULT 0 | 家具・家電費用 |
| renovation_cost | INTEGER | DEFAULT 0 | リフォーム費用 |
| management_fee_rate | DECIMAL(5,2) | DEFAULT 10.00 | 運営代行費率 |
| annual_revenue | INTEGER | NOT NULL | 年間売上 |
| annual_cost | INTEGER | NOT NULL | 年間費用 |
| annual_profit | INTEGER | NOT NULL | 年間利益 |
| roi | DECIMAL(5,2) | NOT NULL | 年間利回り |
| created_at | TIMESTAMP | DEFAULT NOW() | 作成日時 |

## 4. API設計

### 4.1 エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/` | メインページ表示 |
| POST | `/simulate` | シミュレーション実行 |
| POST | `/webhook` | LINE Bot Webhook |
| GET | `/health` | ヘルスチェック |

### 4.2 シミュレーション API

#### POST /simulate
**リクエスト:**
```json
{
  "region": "東京都",
  "propertyType": "1K",
  "monthlyRent": 100000,
  "initialCost": 1000000,
  "furnitureCost": 500000,
  "renovationCost": 0,
  "managementFeeRate": 10
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "annualRevenue": 6300000,
    "annualCost": 2202000,
    "annualProfit": 4098000,
    "roi": 273.2,
    "simulationId": 123
  }
}
```

## 5. LINE Bot設計

### 5.1 LINE Bot設定
- **Bot ID**: `@234zjfds`
- **Bot名**: 有村昆の民泊塾！
- **Webhook URL**: `https://[domain]/webhook`

### 5.2 Bot機能
1. **友だち追加時**: 歓迎メッセージ送信
2. **「結果」コマンド**: 最新のシミュレーション結果を詳細分析して送信
3. **その他メッセージ**: 基本的な案内メッセージ

### 5.3 メッセージフロー
```
ユーザー → Web シミュレーション完了
    ↓
LINE登録ボタンクリック → LINE友だち追加
    ↓
「結果」メッセージ送信 → 詳細分析結果受信
```

## 6. 環境変数設計

### 6.1 必須環境変数

| 変数名 | 説明 | 例 |
|-------|------|---|
| `DATABASE_URL` | PostgreSQL接続URL | `postgresql://user:pass@host:5432/db` |
| `LINE_BOT_ID` | LINE Bot ID | `@234zjfds` |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE API アクセストークン | `[TOKEN]` |
| `LINE_CHANNEL_SECRET` | LINE API チャンネルシークレット | `[SECRET]` |
| `LIFF_ID` | LIFF アプリケーションID | `2007761907-YAmqPZ36` |
| `OPENAI_API_KEY` | OpenAI API キー | `sk-...` |
| `PORT` | サーバーポート | `8080` |

## 7. セキュリティ設計

### 7.1 セキュリティ対策
- 環境変数による機密情報管理
- LINE Webhook署名検証
- SQLインジェクション対策（パラメータ化クエリ）
- XSS対策（入力値サニタイズ）

### 7.2 データ保護
- 個人情報の最小限収集
- データベース暗号化
- HTTPS通信の強制

## 8. パフォーマンス設計

### 8.1 最適化項目
- 静的ファイルの圧縮配信
- データベースインデックス設定
- 適切なHTTPキャッシュヘッダー
- レスポンシブ画像の使用

### 8.2 スケーラビリティ
- Railway自動スケーリング対応
- データベースコネクションプール
- 非同期処理の活用

## 9. 監視・運用設計

### 9.1 ログ設計
- アクセスログ
- エラーログ
- シミュレーション実行ログ
- LINE Bot メッセージログ

### 9.2 監視項目
- サーバー稼働状況
- データベース接続状況
- LINE API応答時間
- OpenAI API応答時間

## 10. デプロイ設計

### 10.1 デプロイフロー
```
GitHub Repository → Railway Auto Deploy → Production
```

### 10.2 環境管理
- **開発環境**: ローカル開発
- **本番環境**: Railway Production

---

**作成日**: 2025年9月22日  
**作成者**: Manus AI  
**バージョン**: 1.0
