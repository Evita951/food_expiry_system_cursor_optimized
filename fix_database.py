import os
import sqlite3
import sys
from datetime import datetime

print("開始修復資料庫...")

# 確保 instance 目錄存在
os.makedirs('instance', exist_ok=True)
db_path = 'instance/food_expiry.db'

# 檢查資料庫檔案是否存在
if not os.path.exists(db_path):
    print(f"資料庫檔案不存在，將創建新檔案: {db_path}")
else:
    print(f"找到現有資料庫: {db_path}")

try:
    # 連接到資料庫
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print("成功連接到資料庫")

    # 檢查 food_item 表格是否存在
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='food_item'")
    if not cursor.fetchone():
        print("food_item 表格不存在，創建新表格...")
        cursor.execute('''
        CREATE TABLE food_item (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT,
            name TEXT NOT NULL,
            expiry_date DATE NOT NULL,
            batch_number TEXT,
            image_path TEXT,
            notes TEXT,
            category TEXT DEFAULT '其他',
            quantity FLOAT DEFAULT 1.0,
            unit TEXT DEFAULT '個',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        print("food_item 表格創建成功")
    else:
        print("food_item 表格已存在，檢查欄位...")
        
        # 獲取現有欄位
        cursor.execute("PRAGMA table_info(food_item)")
        columns = {column[1] for column in cursor.fetchall()}
        
        # 檢查並添加缺少的欄位
        missing_columns = []
        if 'category' not in columns:
            missing_columns.append("category TEXT DEFAULT '其他'")
        if 'quantity' not in columns:
            missing_columns.append("quantity FLOAT DEFAULT 1.0")
        if 'unit' not in columns:
            missing_columns.append("unit TEXT DEFAULT '個'")
        
        # 添加缺少的欄位
        for column_def in missing_columns:
            column_name = column_def.split()[0]
            print(f"添加缺少的欄位: {column_name}")
            cursor.execute(f"ALTER TABLE food_item ADD COLUMN {column_def}")
    
    # 提交變更
    conn.commit()
    print("資料庫修復完成！")

except Exception as e:
    print(f"錯誤: {e}")
    conn.rollback()
    sys.exit(1)

finally:
    # 關閉連接
    if 'conn' in locals():
        conn.close()
