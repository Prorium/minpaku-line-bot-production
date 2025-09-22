# 有村昆の民泊塾 - 民泊投資収益シミュレーター

## 概要
民泊投資の収益性を簡単にシミュレーションできるWebアプリケーションです。
ユーザーは地域、物件タイプ、家賃などの情報を入力し、詳細な投資分析結果をLINE Botで受け取ることができます。

## 機能
- 5ステップの投資シミュレーション
- 7地域対応（東京都、大阪府、京都府、福岡県、沖縄県、北海道、その他地方）
- 6物件タイプ対応（1K、1DK、1LDK、2LDK、3LDK、戸建て）
- LINE Bot連携による詳細分析結果の配信
- レスポンシブデザイン対応

## 技術スタック
- **フロントエンド**: HTML/CSS/JavaScript
- **バックエンド**: Node.js + Express
- **データベース**: PostgreSQL
- **外部API**: LINE Messaging API, OpenAI API
- **デプロイ**: Railway

## 環境変数
```
DATABASE_URL=postgresql://...
LIFF_ID=2007761907-YAmqPZ36
LINE_BOT_ID=@234zjfds
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
OPENAI_API_KEY=...
```

## インストール
```bash
npm install
npm start
```

## LINE Bot連携
ユーザーがシミュレーション完了後、LINE公式アカウント「有村昆の民泊塾！」に登録することで、詳細な投資分析結果を受け取ることができます。

## ライセンス
Private - 有村昆の民泊塾
