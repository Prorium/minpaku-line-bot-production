const express = require('express');
const line = require('@line/bot-sdk');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// PostgreSQL設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// データベーステーブル作成
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS simulations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        region VARCHAR(100),
        property_type VARCHAR(50),
        monthly_rent INTEGER,
        initial_cost INTEGER,
        furniture_cost INTEGER,
        renovation_cost INTEGER,
        management_fee_rate INTEGER,
        annual_revenue INTEGER,
        annual_cost INTEGER,
        annual_profit INTEGER,
        annual_yield DECIMAL(5,2),
        payback_period DECIMAL(4,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// データベース初期化
initializeDatabase();

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 地域データ
const regionData = {
  '東京都': { occupancyRate: 70, averagePrice: 25000 },
  '大阪府': { occupancyRate: 68, averagePrice: 20000 },
  '京都府': { occupancyRate: 65, averagePrice: 22000 },
  '福岡県': { occupancyRate: 60, averagePrice: 18000 },
  '沖縄県': { occupancyRate: 62, averagePrice: 20000 },
  '北海道': { occupancyRate: 55, averagePrice: 15000 },
  'その他地方': { occupancyRate: 40, averagePrice: 10000 }
};

// 物件タイプデータ
const propertyTypeData = {
  '1K': { maxGuests: 2 },
  '1DK': { maxGuests: 2 },
  '1LDK': { maxGuests: 3 },
  '2LDK': { maxGuests: 4 },
  '3LDK': { maxGuests: 6 },
  '戸建て': { maxGuests: 8 }
};

// ルートページ
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>有村昆の民泊塾 | 民泊収益シミュレーター</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: white;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 50px;
                padding: 40px 0;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                background: #4CAF50;
                border-radius: 20px;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
            }
            
            .main-title {
                font-size: 2.5rem;
                margin-bottom: 10px;
                font-weight: bold;
            }
            
            .subtitle {
                font-size: 1.2rem;
                opacity: 0.9;
                margin-bottom: 30px;
            }
            
            .start-button {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 15px 40px;
                font-size: 1.2rem;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
            }
            
            .start-button:hover {
                background: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
            }
            
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin-top: 60px;
            }
            
            .feature-card {
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .feature-icon {
                width: 60px;
                height: 60px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            .feature-title {
                font-size: 1.3rem;
                margin-bottom: 15px;
                font-weight: bold;
            }
            
            .feature-description {
                opacity: 0.9;
                line-height: 1.6;
            }
            
            @media (max-width: 768px) {
                .main-title {
                    font-size: 2rem;
                }
                
                .container {
                    padding: 15px;
                }
                
                .features {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏠</div>
                <h1 class="main-title">3分で分かる！<br>あなたの民泊投資収益</h1>
                <p class="subtitle">あなたの民泊投資にすべて答える</p>
                <button class="start-button" onclick="startSimulation()">シミュレーションを始める</button>
            </div>
            
            <div class="features">
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3 class="feature-title">ゲーム感覚の算出</h3>
                    <p class="feature-description">楽しくシミュレーション</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3 class="feature-title">簡単な入力</h3>
                    <p class="feature-description">必要なデータにサポート</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📈</div>
                    <h3 class="feature-title">詳細な分析</h3>
                    <p class="feature-description">収益性の詳細分析</p>
                </div>
            </div>
        </div>
        
        <script>
            function startSimulation() {
                window.location.href = '/simulation';
            }
        </script>
    </body>
    </html>
  `);
});

// シミュレーションページ
app.get('/simulation', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>民泊収益シミュレーター</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: white;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                margin-bottom: 30px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: #4CAF50;
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .step-indicator {
                text-align: center;
                margin-bottom: 20px;
                font-size: 0.9rem;
                opacity: 0.8;
            }
            
            .step-title {
                font-size: 2rem;
                text-align: center;
                margin-bottom: 40px;
                font-weight: bold;
            }
            
            .options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }
            
            .option-card {
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid transparent;
                border-radius: 15px;
                padding: 25px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            
            .option-card:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-2px);
            }
            
            .option-card.selected {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.2);
            }
            
            .option-icon {
                font-size: 2rem;
                margin-bottom: 15px;
            }
            
            .option-title {
                font-size: 1.3rem;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .option-details {
                font-size: 0.9rem;
                opacity: 0.8;
                margin-bottom: 15px;
            }
            
            .option-stats {
                display: flex;
                justify-content: space-between;
                font-size: 0.8rem;
                opacity: 0.7;
            }
            
            .navigation {
                display: flex;
                justify-content: space-between;
                margin-top: 40px;
            }
            
            .nav-button {
                padding: 12px 30px;
                border: none;
                border-radius: 25px;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .nav-button.back {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }
            
            .nav-button.next {
                background: #4CAF50;
                color: white;
            }
            
            .nav-button:hover {
                transform: translateY(-2px);
            }
            
            .nav-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            .input-section {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 30px;
                margin-bottom: 30px;
                backdrop-filter: blur(10px);
            }
            
            .input-group {
                margin-bottom: 25px;
            }
            
            .input-label {
                display: block;
                margin-bottom: 10px;
                font-weight: bold;
                font-size: 1.1rem;
            }
            
            .slider-container {
                margin: 15px 0;
            }
            
            .slider {
                width: 100%;
                height: 8px;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.3);
                outline: none;
                -webkit-appearance: none;
            }
            
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
            }
            
            .slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
                border: none;
            }
            
            .value-display {
                background: rgba(255, 255, 255, 0.2);
                padding: 10px 15px;
                border-radius: 8px;
                text-align: center;
                font-size: 1.2rem;
                font-weight: bold;
                margin-top: 10px;
            }
            
            .reference-info {
                background: rgba(255, 255, 255, 0.05);
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
            }
            
            .reference-title {
                font-weight: bold;
                margin-bottom: 10px;
                color: #4CAF50;
            }
            
            .reference-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 0.9rem;
            }
            
            .checkbox-group {
                margin: 20px 0;
            }
            
            .checkbox-item {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                cursor: pointer;
            }
            
            .checkbox-item input[type="checkbox"] {
                margin-right: 10px;
                transform: scale(1.2);
            }
            
            .checkbox-item label {
                cursor: pointer;
                font-size: 1rem;
            }
            
            @media (max-width: 768px) {
                .container {
                    padding: 15px;
                }
                
                .options-grid {
                    grid-template-columns: 1fr;
                }
                
                .step-title {
                    font-size: 1.5rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="step-indicator">
                Step <span id="currentStep">1</span> of 5
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 20%"></div>
            </div>
            
            <div id="stepContent">
                <!-- Step content will be dynamically loaded here -->
            </div>
            
            <div class="navigation">
                <button class="nav-button back" id="backButton" onclick="previousStep()">戻る</button>
                <button class="nav-button next" id="nextButton" onclick="nextStep()">次へ</button>
            </div>
        </div>
        
        <script>
            let currentStep = 1;
            let simulationData = {};
            
            const steps = {
                1: {
                    title: '地域を選択',
                    content: 'region'
                },
                2: {
                    title: '物件タイプを選択',
                    content: 'propertyType'
                },
                3: {
                    title: '家賃・初期費用',
                    content: 'costs'
                },
                4: {
                    title: '追加オプション',
                    content: 'options'
                },
                5: {
                    title: 'シミュレーション結果',
                    content: 'results'
                }
            };
            
            const regionData = ${JSON.stringify(regionData)};
            const propertyTypeData = ${JSON.stringify(propertyTypeData)};
            
            function updateStepDisplay() {
                document.getElementById('currentStep').textContent = currentStep;
                document.getElementById('progressFill').style.width = (currentStep / 5) * 100 + '%';
                
                const step = steps[currentStep];
                document.querySelector('.step-title').textContent = step.title;
                
                // Update navigation buttons
                document.getElementById('backButton').style.display = currentStep === 1 ? 'none' : 'block';
                document.getElementById('nextButton').textContent = currentStep === 5 ? '結果を計算' : '次へ';
            }
            
            function loadStepContent() {
                const stepContent = document.getElementById('stepContent');
                const step = steps[currentStep];
                
                let content = '<h2 class="step-title">' + step.title + '</h2>';
                
                switch(step.content) {
                    case 'region':
                        content += generateRegionContent();
                        break;
                    case 'propertyType':
                        content += generatePropertyTypeContent();
                        break;
                    case 'costs':
                        content += generateCostsContent();
                        break;
                    case 'options':
                        content += generateOptionsContent();
                        break;
                    case 'results':
                        content += generateResultsContent();
                        break;
                }
                
                stepContent.innerHTML = content;
                updateStepDisplay();
            }
            
            function generateRegionContent() {
                let content = '<div class="options-grid">';
                
                Object.keys(regionData).forEach(region => {
                    const data = regionData[region];
                    content += \`
                        <div class="option-card" onclick="selectRegion('\${region}')">
                            <div class="option-icon">📍</div>
                            <div class="option-title">\${region}</div>
                            <div class="option-details">\${getRegionDescription(region)}</div>
                            <div class="option-stats">
                                <span>平均稼働率: \${data.occupancyRate}%</span>
                                <span>平均単価: ¥\${data.averagePrice.toLocaleString()}</span>
                            </div>
                        </div>
                    \`;
                });
                
                content += '</div>';
                return content;
            }
            
            function generatePropertyTypeContent() {
                let content = '<div class="options-grid">';
                
                Object.keys(propertyTypeData).forEach(type => {
                    const data = propertyTypeData[type];
                    content += \`
                        <div class="option-card" onclick="selectPropertyType('\${type}')">
                            <div class="option-icon">\${getPropertyIcon(type)}</div>
                            <div class="option-title">\${type}</div>
                            <div class="option-details">👥 最大\${data.maxGuests}名まで</div>
                        </div>
                    \`;
                });
                
                content += '</div>';
                return content;
            }
            
            function generateCostsContent() {
                const region = simulationData.region || '東京都';
                const regionInfo = regionData[region];
                
                return \`
                    <div class="input-section">
                        <h3>月額家賃</h3>
                        <div class="input-group">
                            <label class="input-label">月額家賃 (円)</label>
                            <div class="slider-container">
                                <input type="range" class="slider" id="rentSlider" 
                                       min="50000" max="200000" step="5000" 
                                       value="\${simulationData.monthlyRent || 100000}"
                                       oninput="updateRentValue(this.value)">
                                <div class="value-display" id="rentValue">¥100,000</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="input-section">
                        <h3>初期費用</h3>
                        <div class="input-group">
                            <label class="input-label">初期費用（敷金・礼金・仲介手数料・その他初期費用） (円)</label>
                            <div class="slider-container">
                                <input type="range" class="slider" id="initialCostSlider" 
                                       min="500000" max="2000000" step="50000" 
                                       value="\${simulationData.initialCost || 1000000}"
                                       oninput="updateInitialCostValue(this.value)">
                                <div class="value-display" id="initialCostValue">¥1,000,000</div>
                            </div>
                            <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 10px;">
                                ※敷金・礼金・仲介手数料・その他初期費用の合計を入力してください
                            </p>
                        </div>
                    </div>
                    
                    <div class="reference-info">
                        <div class="reference-title">参考：月額費用</div>
                        <div class="reference-item">
                            <span>月額清掃費</span>
                            <span>¥15,000</span>
                        </div>
                        <div class="reference-item">
                            <span>光熱費・保険料等</span>
                            <span>¥16,000</span>
                        </div>
                    </div>
                \`;
            }
            
            function generateOptionsContent() {
                return \`
                    <div class="input-section">
                        <h3>家具・家電</h3>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="furnitureOption" 
                                       \${simulationData.includeFurniture ? 'checked' : ''}
                                       onchange="toggleFurniture(this.checked)">
                                <label for="furnitureOption">家具・家電を購入する (¥500,000)</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="input-section">
                        <h3>リフォーム費用</h3>
                        <div class="input-group">
                            <label class="input-label">リフォーム費用 (円)</label>
                            <div class="slider-container">
                                <input type="range" class="slider" id="renovationSlider" 
                                       min="0" max="1000000" step="50000" 
                                       value="\${simulationData.renovationCost || 0}"
                                       oninput="updateRenovationValue(this.value)">
                                <div class="value-display" id="renovationValue">¥0</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="input-section">
                        <h3>運営代行費</h3>
                        <div class="input-group">
                            <label class="input-label">売上に対する運営代行費 (%)</label>
                            <div class="slider-container">
                                <input type="range" class="slider" id="managementFeeSlider" 
                                       min="0" max="30" step="1" 
                                       value="\${simulationData.managementFeeRate || 10}"
                                       oninput="updateManagementFeeValue(this.value)">
                                <div class="value-display" id="managementFeeValue">10%</div>
                            </div>
                        </div>
                    </div>
                \`;
            }
            
            function generateResultsContent() {
                calculateResults();
                
                return \`
                    <div style="text-align: center; margin-bottom: 30px;">
                        <p style="font-size: 1.1rem; opacity: 0.9;">あなたの民泊投資の収益予測です</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
                        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center;">
                            <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 5px;">年間売上</div>
                            <div style="font-size: 1.8rem; font-weight: bold; color: #4CAF50;">¥\${simulationData.results.annualRevenue.toLocaleString()}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center;">
                            <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 5px;">年間費用</div>
                            <div style="font-size: 1.8rem; font-weight: bold; color: #f44336;">¥\${simulationData.results.annualCost.toLocaleString()}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center;">
                            <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 5px;">年間利益</div>
                            <div style="font-size: 1.8rem; font-weight: bold; color: #00bcd4;">¥\${simulationData.results.annualProfit.toLocaleString()}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; text-align: center;">
                            <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 5px;">年間利回り</div>
                            <div style="font-size: 1.8rem; font-weight: bold; color: #9c27b0;">\${simulationData.results.annualYield}%</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
                        <div>
                            <h4 style="margin-bottom: 15px; color: #4CAF50;">📊 基本情報</h4>
                            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; font-size: 0.9rem;">
                                <div style="margin-bottom: 8px;">地域: \${simulationData.region}</div>
                                <div style="margin-bottom: 8px;">物件タイプ: \${simulationData.propertyType}</div>
                                <div style="margin-bottom: 8px;">月額家賃: ¥\${simulationData.monthlyRent.toLocaleString()}</div>
                                <div style="margin-bottom: 8px;">初期費用: ¥\${simulationData.initialCost.toLocaleString()}</div>
                                <div style="margin-bottom: 8px;">月間売上: ¥\${Math.round(simulationData.results.annualRevenue / 12).toLocaleString()}</div>
                                <div style="margin-bottom: 8px;">月間費用: ¥\${Math.round(simulationData.results.annualCost / 12).toLocaleString()}</div>
                                <div>月間利益: ¥\${Math.round(simulationData.results.annualProfit / 12).toLocaleString()}</div>
                            </div>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 15px; color: #ff9800;">💰 投資指標</h4>
                            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; font-size: 0.9rem;">
                                <div style="margin-bottom: 8px;">投資回収期間: \${simulationData.results.paybackPeriod}年</div>
                                <div style="margin-bottom: 8px;">総初期費用: ¥\${(simulationData.initialCost + (simulationData.includeFurniture ? 500000 : 0) + simulationData.renovationCost).toLocaleString()}</div>
                                <div style="margin-bottom: 8px;">稼働率: \${regionData[simulationData.region].occupancyRate}%</div>
                                <div>平均単価: ¥\${regionData[simulationData.region].averagePrice.toLocaleString()}/日</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #e91e63, #9c27b0); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 30px;">
                        <h3 style="margin-bottom: 15px; font-size: 1.5rem;">📱 結果は公式LINEより受け取れます</h3>
                        <p style="margin-bottom: 20px; opacity: 0.9;">より詳細な分析結果とプロの投資アドバイスを<br>公式LINEで無料配信中！</p>
                        <!-- FIXED: Use correct LINE Bot ID -->
                        <a href="https://line.me/R/ti/p/@234zjfds" target="_blank" rel="noopener noreferrer" class="line-button" style="display: inline-block; background: #00C300; color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 1.1rem; transition: all 0.3s ease;" onclick="window.open('https://line.me/R/ti/p/@234zjfds', '_blank'); return false;">🔗 公式LINEに登録する</a>
                        
                        <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                            <h4 style="margin-bottom: 15px; color: #4CAF50;">💡 基本収益情報</h4>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px; text-align: left;">
                                <div>月間売上: <span id="basicMonthlySales">¥\${Math.round(simulationData.results.annualRevenue / 12).toLocaleString()}</span></div>
                                <div>月間費用: <span id="basicMonthlyCosts">¥\${Math.round(simulationData.results.annualCost / 12).toLocaleString()}</span></div>
                                <div>月間利益: <span id="basicMonthlyProfit">¥\${Math.round(simulationData.results.annualProfit / 12).toLocaleString()}</span></div>
                                <div>年間利回り: <span id="basicAnnualYield">\${simulationData.results.annualYield}%</span></div>
                            </div>
                        </div>
                    </div>
                \`;
            }
            
            function getRegionDescription(region) {
                const descriptions = {
                    '東京都': '活気ある首都',
                    '大阪府': '関西の中心地',
                    '京都府': '歴史的な観光地',
                    '福岡県': '九州の玄関口',
                    '沖縄県': 'リゾート地',
                    '北海道': '自然豊かな観光地',
                    'その他地方': '地方都市'
                };
                return descriptions[region] || '';
            }
            
            function getPropertyIcon(type) {
                const icons = {
                    '1K': '🏠',
                    '1DK': '🏠',
                    '1LDK': '🏡',
                    '2LDK': '🏡',
                    '3LDK': '🏘️',
                    '戸建て': '🏘️'
                };
                return icons[type] || '🏠';
            }
            
            function selectRegion(region) {
                simulationData.region = region;
                document.querySelectorAll('.option-card').forEach(card => card.classList.remove('selected'));
                event.target.closest('.option-card').classList.add('selected');
                
                // Auto-set rent based on region
                const regionInfo = regionData[region];
                simulationData.monthlyRent = regionInfo.averagePrice * 30; // Approximate monthly rent
            }
            
            function selectPropertyType(type) {
                simulationData.propertyType = type;
                document.querySelectorAll('.option-card').forEach(card => card.classList.remove('selected'));
                event.target.closest('.option-card').classList.add('selected');
            }
            
            function updateRentValue(value) {
                simulationData.monthlyRent = parseInt(value);
                document.getElementById('rentValue').textContent = '¥' + parseInt(value).toLocaleString();
            }
            
            function updateInitialCostValue(value) {
                simulationData.initialCost = parseInt(value);
                document.getElementById('initialCostValue').textContent = '¥' + parseInt(value).toLocaleString();
            }
            
            function updateRenovationValue(value) {
                simulationData.renovationCost = parseInt(value);
                document.getElementById('renovationValue').textContent = '¥' + parseInt(value).toLocaleString();
            }
            
            function updateManagementFeeValue(value) {
                simulationData.managementFeeRate = parseInt(value);
                document.getElementById('managementFeeValue').textContent = value + '%';
            }
            
            function toggleFurniture(checked) {
                simulationData.includeFurniture = checked;
            }
            
            function calculateResults() {
                const region = simulationData.region || '東京都';
                const regionInfo = regionData[region];
                const propertyInfo = propertyTypeData[simulationData.propertyType || '1K'];
                
                // Calculate annual revenue
                const dailyRate = regionInfo.averagePrice;
                const occupancyRate = regionInfo.occupancyRate / 100;
                const annualRevenue = dailyRate * 365 * occupancyRate;
                
                // Calculate annual costs
                const monthlyRent = simulationData.monthlyRent || 100000;
                const managementFeeRate = (simulationData.managementFeeRate || 10) / 100;
                const managementFee = annualRevenue * managementFeeRate;
                const otherMonthlyCosts = 31000; // 清掃費 + 光熱費等
                const annualCost = (monthlyRent + otherMonthlyCosts) * 12 + managementFee;
                
                // Calculate profit and yield
                const annualProfit = annualRevenue - annualCost;
                const totalInitialCost = (simulationData.initialCost || 1000000) + 
                                       (simulationData.includeFurniture ? 500000 : 0) + 
                                       (simulationData.renovationCost || 0);
                const annualYield = totalInitialCost > 0 ? ((annualProfit / totalInitialCost) * 100).toFixed(1) : 0;
                const paybackPeriod = annualProfit > 0 ? (totalInitialCost / annualProfit).toFixed(1) : '∞';
                
                simulationData.results = {
                    annualRevenue: Math.round(annualRevenue),
                    annualCost: Math.round(annualCost),
                    annualProfit: Math.round(annualProfit),
                    annualYield: annualYield,
                    paybackPeriod: paybackPeriod
                };
            }
            
            function nextStep() {
                if (currentStep < 5) {
                    // Validation
                    if (currentStep === 1 && !simulationData.region) {
                        alert('地域を選択してください');
                        return;
                    }
                    if (currentStep === 2 && !simulationData.propertyType) {
                        alert('物件タイプを選択してください');
                        return;
                    }
                    
                    currentStep++;
                    loadStepContent();
                } else {
                    // Save results and show final page
                    saveSimulationResults();
                }
            }
            
            function previousStep() {
                if (currentStep > 1) {
                    currentStep--;
                    loadStepContent();
                }
            }
            
            async function saveSimulationResults() {
                try {
                    const response = await fetch('/api/simulation', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(simulationData)
                    });
                    
                    if (response.ok) {
                        console.log('Simulation results saved successfully');
                    }
                } catch (error) {
                    console.error('Error saving simulation results:', error);
                }
            }
            
            // Initialize the simulation
            loadStepContent();
        </script>
    </body>
    </html>
  `);
});

// シミュレーション結果保存API
app.post('/api/simulation', async (req, res) => {
  try {
    const {
      region,
      propertyType,
      monthlyRent,
      initialCost,
      includeFurniture,
      renovationCost,
      managementFeeRate,
      results
    } = req.body;

    const furnitureCost = includeFurniture ? 500000 : 0;

    const query = `
      INSERT INTO simulations (
        region, property_type, monthly_rent, initial_cost, 
        furniture_cost, renovation_cost, management_fee_rate,
        annual_revenue, annual_cost, annual_profit, annual_yield, payback_period
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const values = [
      region,
      propertyType,
      monthlyRent,
      initialCost,
      furnitureCost,
      renovationCost || 0,
      managementFeeRate || 10,
      results.annualRevenue,
      results.annualCost,
      results.annualProfit,
      parseFloat(results.annualYield),
      parseFloat(results.paybackPeriod)
    ];

    const result = await pool.query(query, values);
    
    res.json({ 
      success: true, 
      simulationId: result.rows[0].id,
      message: 'シミュレーション結果を保存しました' 
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'データベースエラーが発生しました' 
    });
  }
});

// LINE Webhook
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// LINE イベントハンドラー
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const echo = { type: 'text', text: event.message.text };
  return client.replyMessage(event.replyToken, echo);
}

// 統計情報API
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_simulations,
        AVG(annual_yield) as avg_yield,
        AVG(payback_period) as avg_payback_period,
        region,
        COUNT(*) as region_count
      FROM simulations 
      GROUP BY region
      ORDER BY region_count DESC
    `);

    res.json({
      success: true,
      stats: result.rows
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: '統計情報の取得に失敗しました'
    });
  }
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database URL: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`);
  console.log(`LINE Channel Access Token: ${process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'configured' : 'not configured'}`);
  console.log(`LINE Channel Secret: ${process.env.LINE_CHANNEL_SECRET ? 'configured' : 'not configured'}`);
  console.log(`LINE_BOT_ID: ${process.env.LINE_BOT_ID ? 'configured' : 'not configured'}`);
});
// Updated: Mon Sep 22 00:33:09 EDT 2025
