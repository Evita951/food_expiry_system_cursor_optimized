# 食品效期辨識與管理系統使用指南

## 系統簡介

食品效期辨識與管理系統是一個專為 Cursor 編輯器環境優化的應用程式，可協助用戶管理家中食品的效期，避免食品浪費。系統具備以下功能：

1. **批量上傳與辨識**：支援多張圖片同時上傳與辨識
2. **智能辨識**：自動辨識食品效期日期與條碼
3. **分類管理**：自動分類食品並提供分類統計
4. **到期提醒**：顯示即將到期與已過期食品
5. **資料視覺化**：提供食品分類統計圖表

## 安裝與設定

### 系統需求

- Python 3.8 或更高版本
- 支援的作業系統：Windows、macOS、Linux
- 建議使用 Cursor 編輯器以獲得最佳體驗

### 安裝步驟

1. 解壓縮下載的 ZIP 檔案到您選擇的目錄

2. 安裝必要的依賴項：
   ```bash
   pip install flask flask-sqlalchemy pytesseract opencv-python numpy pyzbar
   ```

3. 安裝 Tesseract OCR 引擎：
   - Windows：從 [此處](https://github.com/UB-Mannheim/tesseract/wiki) 下載並安裝
   - macOS：`brew install tesseract`
   - Linux：`sudo apt install tesseract-ocr`

4. 修復並初始化資料庫：
   ```bash
   python fix_database.py
   python src/db_init.py
   ```

5. 啟動應用程式：
   ```bash
   python src/main.py
   ```

6. 在瀏覽器中訪問：`http://localhost:5000`

## 使用方法

### 上傳與辨識食品

1. 在首頁點擊上傳區域或拖放圖片到上傳區域
2. 選擇一張或多張食品圖片（支援 JPG、PNG、JPEG、WebP 格式）
3. 點擊「識別食品」按鈕開始辨識
4. 辨識完成後，系統會顯示每張圖片的辨識結果
5. 點擊「使用此結果」將辨識結果填入表單
6. 檢查並修正表單中的資訊，然後點擊「新增/更新食品」保存

### 管理食品資料

1. 「即將到期」標籤頁顯示 30 天內到期的食品
2. 「所有食品記錄」標籤頁顯示所有已保存的食品
3. 使用分類篩選功能可以快速找到特定類別的食品
4. 點擊編輯按鈕可以修改食品資料
5. 點擊刪除按鈕可以刪除食品記錄

### 儀表板與統計

首頁上方的儀表板顯示：
- 總食品數量
- 即將到期數量
- 已過期數量
- 食品分類統計圖表

## 故障排除

### 資料庫問題

如果遇到資料庫相關錯誤，請嘗試：

1. 執行修復腳本：
   ```bash
   python fix_database.py
   ```

2. 如果問題仍然存在，嘗試刪除並重建資料庫：
   ```bash
   rm -f instance/food_expiry.db
   python src/db_init.py
   ```

### 辨識問題

如果辨識結果不準確：

1. 確保圖片清晰，效期日期和條碼可見
2. 嘗試不同角度拍攝食品
3. 確保已正確安裝 Tesseract OCR 引擎

### 啟動問題

如果應用程式無法啟動：

1. 檢查是否已安裝所有必要的依賴項
2. 確保端口 5000 未被其他應用程式佔用
3. 檢查錯誤訊息並解決相應問題

## 系統架構

本系統採用 Flask 框架開發，主要組件包括：

- **前端**：HTML、CSS、JavaScript、Bootstrap
- **後端**：Flask、SQLAlchemy
- **資料庫**：SQLite
- **辨識模組**：OpenCV、Tesseract OCR、pyzbar

## 檔案結構

```
food_expiry_system/
├── fix_database.py          # 資料庫修復腳本
├── requirements.txt         # 依賴項列表
├── src/
│   ├── __init__.py
│   ├── main.py              # 主應用程式
│   ├── db_init.py           # 資料庫初始化腳本
│   ├── models/
│   │   ├── __init__.py
│   │   ├── food_item.py     # 食品項目模型
│   │   └── recognition/
│   │       ├── __init__.py
│   │       └── food_recognition.py  # 食品辨識模組
│   ├── routes/
│   │   ├── __init__.py
│   │   └── upload.py        # 上傳與辨識路由
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css    # 樣式表
│   │   ├── js/
│   │   │   └── main.js      # 前端腳本
│   │   └── uploads/         # 上傳的圖片
│   └── templates/
│       └── index.html       # 首頁模板
└── instance/
    └── food_expiry.db       # SQLite 資料庫
```

## 技術說明

### CPU 優化

本系統特別針對 CPU 環境進行了優化：

1. **移除 GPU 依賴**：不使用需要 GPU 的深度學習模型
2. **多線程處理**：使用 ThreadPoolExecutor 並行處理多張圖片
3. **輕量級辨識**：使用 OpenCV 和 Tesseract OCR 進行輕量級辨識
4. **智能分類**：基於檔案名和條碼進行食品分類

### 資料庫結構

食品項目表 (food_item) 包含以下欄位：

- id：主鍵
- barcode：條碼
- name：品名
- expiry_date：到期日
- batch_number：批號
- image_path：圖片路徑
- notes：備註
- category：分類
- quantity：數量
- unit：單位
- created_at：創建時間
- updated_at：更新時間

## 聯絡與支援

如有任何問題或建議，請聯絡系統開發者。

---

© 2025 食品效期辨識與管理系統 | 版本 2.0 | 專為 Cursor 編輯器優化
