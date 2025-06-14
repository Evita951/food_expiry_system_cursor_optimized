"""
食品辨識模組 - 整合OCR與條碼辨識
CPU優化版本：提升辨識速度與準確度
"""

import os
import cv2
import numpy as np
import pytesseract
from datetime import datetime
import re
from concurrent.futures import ThreadPoolExecutor
import threading
from pyzbar.pyzbar import decode

# 設定 Tesseract 可執行檔路徑 (如果未在系統PATH中)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe' # 請依實際安裝路徑修改

# 食品辨識系統
class FoodRecognitionSystem:
    """食品辨識系統，整合多種辨識方法"""
    
    def __init__(self):
        """初始化辨識系統"""
        # 食品類別映射表（擴充）
        self.food_categories = {
            'apple': '水果',
            'banana': '水果',
            'orange': '水果',
            'broccoli': '蔬菜',
            'carrot': '蔬菜',
            'hot dog': '肉類',
            'pizza': '烘焙',
            'donut': '烘焙',
            'cake': '烘焙',
            'sandwich': '烘焙',
            'bread': '烘焙',
            'bottle': '飲料',
            'wine glass': '飲料',
            'cup': '飲料',
            'fork': '其他',
            'knife': '其他',
            'spoon': '其他',
            'bowl': '其他',
            'chair': '其他',
            'person': '其他',
            'refrigerator': '其他',
            'oven': '其他',
            'microwave': '其他',
            'toaster': '其他',
            'sink': '其他',
            'dining table': '其他',
            'pringles': '零食',
            'chips': '零食',
            'cookie': '零食',
            'chocolate': '零食',
            'candy': '零食',
            'milk': '乳製品',
            'yogurt': '乳製品',
            'cheese': '乳製品',
            'butter': '乳製品',
            'cream': '乳製品',
            'beef': '肉類',
            'pork': '肉類',
            'chicken': '肉類',
            'fish': '海鮮',
            'shrimp': '海鮮',
            'crab': '海鮮',
            'soda': '飲料',
            'juice': '飲料',
            'water': '飲料',
            'tea': '飲料',
            'coffee': '飲料',
            'sauce': '調味料',
            'oil': '調味料',
            'salt': '調味料',
            'sugar': '調味料',
            'pepper': '調味料',
            'frozen food': '冷凍食品',
            'ice cream': '冷凍食品',
            'dumpling': '冷凍食品',
            'vegetable': '蔬菜',
            'fruit': '水果',
            'snack': '零食',
            'drink': '飲料',
            'can': '罐頭',
            'box': '其他',
            'package': '其他',
            'bag': '其他'
        }
    
    def process_images_batch(self, image_paths):
        """批量處理多張圖片，保持原始順序"""
        print(f"批量處理 {len(image_paths)} 張圖片")
        
        # 使用線程池並行處理
        with ThreadPoolExecutor(max_workers=min(len(image_paths), 4)) as executor:
            results = list(executor.map(self.process_image, image_paths))
        
        return results
    
    def process_image(self, image_path):
        """處理單張圖片，整合多種辨識方法"""
        print(f"處理圖片: {image_path}")
        
        try:
            # 讀取圖片
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'success': False,
                    'error': f"無法讀取圖片: {image_path}"
                }
            
            # 並行執行多種辨識
            with ThreadPoolExecutor(max_workers=2) as executor:
                # 提交效期辨識任務
                expiry_future = executor.submit(self.recognize_expiry_date, image)
                # 提交條碼辨識任務
                barcode_future = executor.submit(self.recognize_barcode, image)
                
                # 獲取結果
                expiry_result = expiry_future.result()
                barcode_result = barcode_future.result()
            
            # 基於條碼或圖片名稱推測食品類別
            food_name = self.extract_name_from_path(image_path)
            food_category = self.guess_food_category(image_path, barcode_result.get('barcode'))
            
            # 檢查辨識結果並返回具體錯誤
            if not barcode_result.get('barcode'):
                return {'success': False, 'error': '辨識失敗：找不到條碼'}
            
            if not expiry_result.get('date'):
                return {'success': False, 'error': '辨識失敗：找不到效期'}
            
            if not food_name or food_name == "未知食品":
                return {'success': False, 'error': '辨識失敗：找不到品名'}

            # 合併結果
            result = {
                'success': True,
                'food_name': food_name,
                'food_category': food_category,
                'expiry_date': expiry_result.get('date'),
                'barcode': barcode_result.get('barcode'),
                'image_path': image_path
            }
            
            return result
            
        except Exception as e:
            print(f"處理圖片時發生錯誤: {str(e)}")
            return {
                'success': False,
                'error': '辨識失敗：系統錯誤，請稍後再試'
            }
    
    def extract_name_from_path(self, image_path):
        """從圖片路徑中提取可能的食品名稱"""
        # 獲取檔案名（不含路徑和副檔名）
        filename = os.path.basename(image_path)
        name = os.path.splitext(filename)[0]
        
        # 移除UUID前綴（如果有）
        if '-' in name:
            parts = name.split('-')
            if len(parts) > 1 and len(parts[0]) == 36:  # UUID長度
                name = '-'.join(parts[1:])
        
        # 移除數字和特殊字符
        name = re.sub(r'[0-9_]', ' ', name)
        
        # 清理和格式化
        name = ' '.join(name.split())
        
        return name if name else "未知食品"
    
    def guess_food_category(self, image_path, barcode):
        """根據圖片路徑和條碼推測食品類別"""
        # 從檔案名中提取關鍵字
        filename = os.path.basename(image_path).lower()
        
        # 檢查檔案名中是否包含類別關鍵字
        for key, category in self.food_categories.items():
            if key in filename:
                return category
        
        # 如果有條碼，可以根據條碼前幾位判斷類別
        # 這裡只是示例，實際應用中可能需要更複雜的邏輯或外部API
        if barcode:
            if barcode.startswith('20'):  # 假設20開頭是水果
                return '水果'
            elif barcode.startswith('21'):  # 假設21開頭是蔬菜
                return '蔬菜'
            elif barcode.startswith('22'):  # 假設22開頭是肉類
                return '肉類'
            elif barcode.startswith('23'):  # 假設23開頭是飲料
                return '飲料'
            elif barcode.startswith('24'):  # 假設24開頭是零食
                return '零食'
        
        # 默認分類
        return '其他'
    
    def recognize_expiry_date(self, image):
        """辨識圖片中的效期日期"""
        result = {'date': None}
        
        try:
            # 預處理圖片以提高OCR準確度
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 自適應二值化
            binary = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # 增強對比度
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            
            # 使用多種預處理方法進行OCR
            images = [gray, binary, enhanced]
            texts = []
            
            for img in images:
                # 使用pytesseract進行OCR
                text = pytesseract.image_to_string(img, lang='eng', config='--psm 11')
                texts.append(text)
            
            # 合併所有文本
            all_text = ' '.join(texts)
            
            # 尋找日期格式
            # 格式1: YYYY-MM-DD 或 YYYY/MM/DD
            pattern1 = r'(20\d{2})[/\-\.](0[1-9]|1[0-2])[/\-\.](0[1-9]|[12][0-9]|3[01])'
            # 格式2: DD/MM/YYYY 或 DD-MM-YYYY
            pattern2 = r'(0[1-9]|[12][0-9]|3[01])[/\-\.](0[1-9]|1[0-2])[/\-\.](20\d{2})'
            # 格式3: MM/DD/YYYY 或 MM-DD-YYYY
            pattern3 = r'(0[1-9]|1[0-2])[/\-\.](0[1-9]|[12][0-9]|3[01])[/\-\.](20\d{2})'
            # 格式4: YYYYMMDD
            pattern4 = r'(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])'
            
            # 尋找所有匹配
            matches = []
            
            # 格式1
            for match in re.finditer(pattern1, all_text):
                year, month, day = match.groups()
                matches.append(f"{year}-{month}-{day}")
            
            # 格式2
            for match in re.finditer(pattern2, all_text):
                day, month, year = match.groups()
                matches.append(f"{year}-{month}-{day}")
            
            # 格式3
            for match in re.finditer(pattern3, all_text):
                month, day, year = match.groups()
                matches.append(f"{year}-{month}-{day}")
            
            # 格式4
            for match in re.finditer(pattern4, all_text):
                year, month, day = match.groups()
                matches.append(f"{year}-{month}-{day}")
            
            # 如果找到日期
            if matches:
                # 選擇最可能的日期（假設是最後一個匹配）
                result['date'] = matches[-1]
                print(f"辨識到效期日期: {result['date']}")
            
        except Exception as e:
            print(f"效期辨識時發生錯誤: {str(e)}")
        
        return result
    
    def recognize_barcode(self, image):
        """辨識圖片中的條碼"""
        result = {'barcode': None}
        
        try:
            # 預處理圖片以提高條碼辨識準確度
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 嘗試不同的預處理方法
            preprocessed_images = [
                gray,  # 原始灰度圖
                cv2.GaussianBlur(gray, (5, 5), 0),  # 高斯模糊
                cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]  # Otsu二值化
            ]
            
            # 對每個預處理圖片嘗試解碼
            for img in preprocessed_images:
                barcodes = decode(img)
                
                if barcodes:
                    # 獲取第一個條碼
                    barcode = barcodes[0]
                    barcode_data = barcode.data.decode('utf-8')
                    barcode_type = barcode.type
                    
                    print(f"辨識到條碼: {barcode_data}, 類型: {barcode_type}")
                    
                    # 設置結果
                    result['barcode'] = barcode_data
                    break
            
        except Exception as e:
            print(f"條碼辨識時發生錯誤: {str(e)}")
        
        return result
