/**
 * 食品效期辨識與管理系統 - 前端互動腳本
 */

// 立即執行，確認腳本載入
console.log("食品效期辨識系統前端腳本已載入");

// DOM 元素載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM已完全載入，開始初始化系統");
    
    // 初始化變數
    let uploadedImages = [];
    let recognitionResults = [];
    let mergedResults = {}; // 新增：合併後的辨識結果
    
    // DOM 元素
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const clearImagesBtn = document.getElementById('clearImagesBtn');
    const recognizeBtn = document.getElementById('recognizeBtn');
    const recognitionResultsDiv = document.getElementById('recognitionResults');
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');
    const foodForm = document.getElementById('foodForm');
    const clearFormBtn = document.getElementById('clearFormBtn');
    const refreshExpiringBtn = document.getElementById('refreshExpiringBtn');
    const refreshAllBtn = document.getElementById('refreshAllBtn');
    const expiringTableBody = document.getElementById('expiringFoodList');
    const allTableBody = document.getElementById('allFoodList');
    const expiringEmptyMessage = document.getElementById('expiringEmptyMessage');
    const allEmptyMessage = document.getElementById('allEmptyMessage');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const categoryFilterSelect = document.getElementById('categoryFilter'); // 新增：分類篩選選單
    
    // 檢查DOM元素是否存在 (新增日誌)
    console.log("初始化DOM元素:");
    console.log("- expiringTableBody:", expiringTableBody);
    console.log("- allTableBody:", allTableBody);
    
    // 檢查DOM元素是否存在
    console.log("檢查關鍵DOM元素:");
    console.log("- uploadArea:", uploadArea);
    console.log("- fileInput:", fileInput);
    console.log("- previewContainer:", previewContainer);
    console.log("- clearImagesBtn:", clearImagesBtn);
    console.log("- recognizeBtn:", recognizeBtn);
    
    // 初始化頁面
    initPage();
    
    // 上傳區域點擊事件
    if (uploadArea) {
        console.log("綁定上傳區域點擊事件");
        uploadArea.addEventListener('click', function(e) {
            console.log("上傳區域被點擊");
            if (fileInput) {
                fileInput.click();
            } else {
                console.error("找不到fileInput元素");
                alert("系統錯誤：找不到檔案上傳元素");
            }
        });
    } else {
        console.error("找不到uploadArea元素");
    }
    
    // 檔案選擇事件
    if (fileInput) {
        console.log("綁定檔案選擇事件");
        fileInput.addEventListener('change', function(e) {
            console.log("檔案選擇事件觸發:", e);
            console.log("選擇的檔案數量:", this.files.length);
            if (this.files.length > 0) {
                handleFiles(this.files);
            }
        });
    } else {
        console.error("找不到fileInput元素");
    }
    
    // 拖放事件
    if (uploadArea) {
        console.log("綁定拖放事件");
        uploadArea.addEventListener('dragover', function(e) {
            console.log("拖放經過事件觸發");
            e.preventDefault();
            uploadArea.classList.add('highlight');
        });
        
        uploadArea.addEventListener('dragleave', function() {
            console.log("拖放離開事件觸發");
            uploadArea.classList.remove('highlight');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            console.log("拖放釋放事件觸發");
            e.preventDefault();
            uploadArea.classList.remove('highlight');
            
            if (e.dataTransfer.files.length > 0) {
                console.log("拖放的檔案數量:", e.dataTransfer.files.length);
                handleFiles(e.dataTransfer.files);
            }
        });
    }
    
    // 清除所有圖片按鈕
    if (clearImagesBtn) {
        clearImagesBtn.addEventListener('click', function() {
            console.log("清除所有圖片按鈕被點擊");
            clearImages();
        });
    }
    
    // 識別食品按鈕
    if (recognizeBtn) {
        recognizeBtn.addEventListener('click', function() {
            console.log("識別食品按鈕被點擊");
            recognizeImages();
        });
    }
    
    // 清除表單按鈕
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', function() {
            console.log("清除表單按鈕被點擊");
            clearForm();
        });
    }
    
    // 表單提交事件
    if (foodForm) {
        foodForm.addEventListener('submit', function(e) {
            console.log("表單提交事件觸發");
            e.preventDefault();
            saveFood();
        });
    }
    
    // 重新整理資料按鈕
    if (refreshExpiringBtn) {
        refreshExpiringBtn.addEventListener('click', function() {
            console.log("重新整理即將到期清單按鈕被點擊");
            loadExpiringFoodList();
        });
    }
    
    if (refreshAllBtn) {
        refreshAllBtn.addEventListener('click', function() {
            console.log("重新整理所有清單按鈕被點擊");
            loadAllFoodList();
        });
    }
    
    // 新增：分類篩選事件
    if (categoryFilterSelect) {
        categoryFilterSelect.addEventListener('change', function() {
            console.log("分類篩選變更:", this.value);
            filterFoodListByCategory(this.value);
        });
    }
    
    /**
     * 初始化頁面
     */
    function initPage() {
        console.log("初始化頁面");
        // 載入食品列表
        loadExpiringFoodList();
        loadAllFoodList();
        
        // 更新儀表板
        updateDashboard();
        
        // 設置今天日期為預設到期日
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const expiryDateInput = document.getElementById('expiryDate');
        if (expiryDateInput) {
            expiryDateInput.value = formattedDate;
        }
        
        // 新增：載入分類統計
        loadCategoryStats();
    }
    
    /**
     * 處理上傳的檔案
     * @param {FileList} files - 上傳的檔案列表
     */
    function handleFiles(files) {
        console.log("處理上傳檔案，數量:", files.length);
        
        // 檢查檔案格式
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`檢查檔案 ${i+1}:`, file.name, file.type, file.size);
            
            // 檢查檔案類型
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert(`不支援的檔案類型: ${file.name}\n請上傳JPG、PNG或WEBP格式的圖片`);
                return;
            }
            
            // 檢查檔案大小 (限制為10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`檔案過大: ${file.name}\n請上傳小於10MB的圖片`);
                return;
            }
        }
        
        // 顯示載入中
        showLoading('上傳圖片中...');
        
        // 創建FormData對象
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]);
        }
        
        console.log("準備發送上傳請求到 /api/upload");
        
        // 發送上傳請求
        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log("上傳請求回應狀態:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP錯誤! 狀態: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("上傳請求回應數據:", data);
            
            if (data.results && data.results.length > 0) {
                // 處理上傳結果
                data.results.forEach(result => {
                    if (result.success) {
                        // 添加到上傳圖片列表
                        uploadedImages.push({
                            path: result.image_path,
                            filename: result.original_filename
                        });
                        console.log("成功上傳圖片:", result.original_filename);
                    } else {
                        console.error("圖片上傳失敗:", result.original_filename, result.error);
                    }
                });
                
                // 更新預覽
                updatePreview();
                
                // 更新按鈕狀態
                updateButtonStatus();
            } else {
                console.error("上傳回應中沒有結果數據");
                alert('上傳圖片失敗，伺服器回應無效');
            }
            
            // 隱藏載入中
            hideLoading();
        })
        .catch(error => {
            console.error('上傳圖片失敗:', error);
            alert('上傳圖片失敗: ' + error.message);
            hideLoading();
        });
    }
    
    /**
     * 更新圖片預覽
     */
    function updatePreview() {
        console.log("更新圖片預覽，圖片數量:", uploadedImages.length);
        
        // 清空預覽容器
        if (previewContainer) {
            previewContainer.innerHTML = '';
            
            // 如果有上傳的圖片，顯示預覽容器
            if (uploadedImages.length > 0) {
                previewContainer.style.display = 'flex';
                
                // 為每張圖片創建預覽元素
                uploadedImages.forEach((image, index) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    
                    const img = document.createElement('img');
                    img.src = image.path;
                    img.alt = image.filename;
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.innerHTML = '<i class="bi bi-x"></i>';
                    deleteBtn.dataset.index = index;
                    deleteBtn.addEventListener('click', function() {
                        deleteImage(index);
                    });
                    
                    previewItem.appendChild(img);
                    previewItem.appendChild(deleteBtn);
                    previewContainer.appendChild(previewItem);
                });
            } else {
                previewContainer.style.display = 'none';
            }
        } else {
            console.error("找不到previewContainer元素");
        }
    }
    
    /**
     * 更新按鈕狀態
     */
    function updateButtonStatus() {
        console.log("更新按鈕狀態");
        
        if (clearImagesBtn) {
            clearImagesBtn.disabled = uploadedImages.length === 0;
        }
        
        if (recognizeBtn) {
            recognizeBtn.disabled = uploadedImages.length === 0;
        }
    }
    
    /**
     * 刪除圖片
     * @param {number} index - 圖片索引
     */
    function deleteImage(index) {
        console.log("刪除圖片，索引:", index);
        
        // 顯示載入中
        showLoading('刪除圖片中...');
        
        // 獲取要刪除的圖片路徑
        const imagePath = uploadedImages[index].path;
        
        // 發送刪除請求
        fetch('/api/delete-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_path: imagePath
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("圖片刪除成功");
                // 從列表中移除
                uploadedImages.splice(index, 1);
                
                // 更新預覽
                updatePreview();
                
                // 更新按鈕狀態
                updateButtonStatus();
            } else {
                console.error("圖片刪除失敗:", data.error);
                alert('刪除圖片失敗：' + (data.error || '未知錯誤'));
            }
            
            // 隱藏載入中
            hideLoading();
        })
        .catch(error => {
            console.error('刪除圖片失敗:', error);
            alert('刪除圖片失敗，請重試');
            hideLoading();
        });
    }
    
    /**
     * 清除所有圖片
     */
    function clearImages() {
        console.log("清除所有圖片");
        
        // 如果沒有圖片，直接返回
        if (uploadedImages.length === 0) {
            return;
        }
        
        // 確認是否清除
        if (!confirm('確定要清除所有上傳的圖片嗎？')) {
            return;
        }
        
        // 顯示載入中
        showLoading('清除圖片中...');
        
        // 創建刪除請求的Promise陣列
        const deletePromises = uploadedImages.map(image => {
            return fetch('/api/delete-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_path: image.path
                })
            }).then(response => response.json());
        });
        
        // 等待所有刪除請求完成
        Promise.all(deletePromises)
            .then(() => {
                console.log("所有圖片刪除成功");
                // 清空列表
                uploadedImages = [];
                
                // 更新預覽
                updatePreview();
                
                // 更新按鈕狀態
                updateButtonStatus();
                
                // 隱藏載入中
                hideLoading();
            })
            .catch(error => {
                console.error('清除圖片失敗:', error);
                alert('清除圖片失敗，請重試');
                hideLoading();
            });
    }
    
    /**
     * 識別圖片
     */
    function recognizeImages() {
        console.log("開始識別圖片");
        
        // 如果沒有圖片，直接返回
        if (uploadedImages.length === 0) {
            return;
        }
        
        // 顯示載入中
        showLoading('識別食品中，這可能需要一些時間...');
        
        // 準備圖片路徑列表
        const imagePaths = uploadedImages.map(image => image.path);
        
        // 發送識別請求
        fetch('/api/recognize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                images: imagePaths
            })
        })
        .then(response => {
            // 檢查 HTTP 回應是否成功
            if (!response.ok) {
                console.error("HTTP 錯誤，狀態碼:", response.status, response.statusText);
                // 嘗試讀取後端返回的錯誤訊息
                return response.json().then(errorData => {
                    throw new Error(errorData.error || `HTTP 錯誤: ${response.status}`);
                }).catch(() => {
                    // 如果無法解析 JSON 錯誤訊息，則拋出通用錯誤
                    throw new Error(`網路或伺服器錯誤: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("識別結果回應:", data); // 輸出原始回應數據
            
            // 檢查回應數據結構，確保有 success 屬性
            if (data && data.results && Array.isArray(data.results)) {
                // 保存識別結果
                recognitionResults = data.results;
                
                // 重置合併結果
                mergedResults = {};
                
                // 顯示識別結果
                showRecognitionResults(data.results);
            } else {
                console.error("識別回應中沒有預期的數據結構:", data);
                alert('識別失敗：後端數據結構異常');
            }
            
            // 隱藏載入中
            hideLoading();
        })
        .catch(error => {
            console.error('識別食品失敗:', error);
            alert('識別食品失敗：' + (error.message || '請檢查網路連線或稍後再試'));
            hideLoading();
        });
    }
    
    /**
     * 顯示識別結果
     * @param {Array} results - 識別結果列表
     */
    function showRecognitionResults(results) {
        console.log("顯示識別結果，數量:", results.length);
        
        // 清空結果容器
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
            
            // 顯示結果區域
            if (recognitionResultsDiv) {
                recognitionResultsDiv.style.display = 'block';
            }
            
            // 為每個結果創建卡片
            results.forEach((result, index) => {
                const card = document.createElement('div');
                card.className = 'card mb-3 recognition-result';
                
                // 獲取識別結果 - 直接使用 result 物件
                const recognitionResult = result; 
                
                // 創建卡片內容
                let cardContent = `
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <img src="${result.image_path}" class="img-fluid rounded" alt="食品圖片">
                            </div>
                            <div class="col-md-8">
                                <h5 class="card-title">識別結果 #${index + 1}</h5>
                `;
                
                // 檢查識別是否成功
                if (recognitionResult.success) {
                    // 添加識別到的資訊
                    cardContent += `
                        <div class="mb-2">
                            <strong>品名：</strong> ${recognitionResult.food_name || '未識別到'}
                        </div>
                        <div class="mb-2">
                            <strong>條碼：</strong> ${recognitionResult.barcode || '未識別到'}
                        </div>
                        <div class="mb-2">
                            <strong>到期日：：</strong> ${recognitionResult.expiry_date || '未識別到'}
                        </div>
                        <div class="mb-2">
                            <strong>分類：</strong> ${recognitionResult.food_category || '其他'}
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-primary btn-sm use-result-btn" data-index="${index}">使用此結果</button>
                        </div>
                    `;
                } else {
                    // 識別失敗
                    cardContent += `
                        <div class="alert alert-warning">
                            識別失敗：${recognitionResult.error || '未知錯誤'}
                        </div>
                    `;
                }
                
                cardContent += `
                            </div>
                        </div>
                    </div>
                `;
                
                card.innerHTML = cardContent;
                
                // 添加使用結果按鈕事件
                const useResultBtn = card.querySelector('.use-result-btn');
                if (useResultBtn) {
                    useResultBtn.addEventListener('click', function() {
                        const resultIndex = parseInt(this.dataset.index);
                        useRecognitionResult(resultIndex);
                    });
                }
                
                resultsContainer.appendChild(card);
            });
        } else {
            console.error("找不到resultsContainer元素");
        }
    }
    
    /**
     * 使用識別結果
     * @param {number} index - 結果索引
     */
    function useRecognitionResult(index) {
        console.log("使用識別結果，索引:", index);
        
        // 獲取識別結果
        const result = recognitionResults[index];
        
        if (!result.success) {
            alert('無法使用失敗的識別結果');
            return;
        }
        
        // 新增：智能合併結果
        mergeRecognitionResult(result);
        
        // 填充表單
        fillFormWithMergedResults();
    }
    
    /**
     * 新增：智能合併識別結果
     * @param {Object} result - 識別結果
     */
    function mergeRecognitionResult(result) {
        console.log("合併識別結果:", result);
        
        // 合併條碼
        if (result.barcode && !mergedResults.barcode) {
            mergedResults.barcode = result.barcode;
        }
        
        // 合併品名
        if (result.food_name && !mergedResults.name) {
            mergedResults.name = result.food_name;
        }
        
        // 合併到期日
        if (result.expiry_date && !mergedResults.expiry_date) {
            mergedResults.expiry_date = result.expiry_date;
        }
        
        // 合併分類
        if (result.food_category && !mergedResults.category) {
            mergedResults.category = result.food_category;
        }
        
        // 合併圖片路徑
        if (result.image_path && !mergedResults.image_path) {
            mergedResults.image_path = result.image_path;
        }
        
        console.log("合併後的結果:", mergedResults);
    }
    
    /**
     * 新增：使用合併後的結果填充表單
     */
    function fillFormWithMergedResults() {
        console.log("填充表單，使用合併後的結果");
        
        // 填充條碼
        const barcodeInput = document.getElementById('barcode');
        if (barcodeInput && mergedResults.barcode) {
            barcodeInput.value = mergedResults.barcode;
        }
        
        // 填充品名
        const nameInput = document.getElementById('name');
        if (nameInput && mergedResults.name) {
            nameInput.value = mergedResults.name;
        }
        
        // 填充到期日
        const expiryDateInput = document.getElementById('expiryDate');
        if (expiryDateInput && mergedResults.expiry_date) {
            expiryDateInput.value = mergedResults.expiry_date;
        }
        
        // 填充分類
        const categorySelect = document.getElementById('category');
        if (categorySelect && mergedResults.category) {
            // 檢查是否有對應的選項
            const options = Array.from(categorySelect.options);
            const option = options.find(opt => opt.value === mergedResults.category);
            
            if (option) {
                categorySelect.value = mergedResults.category;
            }
        }
        
        // 填充圖片路徑
        const imagePathInput = document.getElementById('imagePath');
        if (imagePathInput && mergedResults.image_path) {
            imagePathInput.value = mergedResults.image_path;
        }
    }
    
    /**
     * 清除表單
     */
    function clearForm() {
        console.log("清除表單");
        
        // 重置表單
        if (foodForm) {
            foodForm.reset();
            
            // 清除隱藏字段
            const foodIdInput = document.getElementById('foodId');
            if (foodIdInput) {
                foodIdInput.value = '';
            }
            
            const imagePathInput = document.getElementById('imagePath');
            if (imagePathInput) {
                imagePathInput.value = '';
            }
            
            // 設置今天日期為預設到期日
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            const expiryDateInput = document.getElementById('expiryDate');
            if (expiryDateInput) {
                expiryDateInput.value = formattedDate;
            }
        }
        
        // 清除合併結果
        mergedResults = {};
    }
    
    /**
     * 保存食品資料
     */
    function saveFood() {
        console.log("保存食品資料");
        
        // 獲取表單數據
        const foodId = document.getElementById('foodId').value;
        const barcode = document.getElementById('barcode').value;
        const name = document.getElementById('name').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const batchNumber = document.getElementById('batchNumber').value;
        const imagePath = document.getElementById('imagePath').value;
        const notes = document.getElementById('notes').value;
        const category = document.getElementById('category').value;
        const quantity = document.getElementById('quantity').value;
        const unit = document.getElementById('unit').value;
        
        // 檢查必填字段
        if (!name) {
            alert('請輸入品名');
            return;
        }
        
        if (!expiryDate) {
            alert('請選擇到期日');
            return;
        }
        
        // 顯示載入中
        showLoading('保存食品資料中...');
        
        // 準備請求數據
        const requestData = {
            id: foodId || null,
            barcode: barcode,
            name: name,
            expiry_date: expiryDate,
            batch_number: batchNumber,
            image_path: imagePath,
            notes: notes,
            category: category,
            quantity: quantity,
            unit: unit
        };
        
        // 發送保存請求
        fetch('/api/save-food', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("食品資料保存成功:", data.food_item);
                
                // 清除表單
                clearForm();
                
                // 重新載入食品列表
                loadExpiringFoodList();
                loadAllFoodList();
                
                // 更新儀表板
                updateDashboard();
                
                // 顯示成功訊息
                alert('食品資料已成功保存');
            } else {
                console.error("食品資料保存失敗:", data.error);
                alert('保存食品資料失敗：' + (data.error || '未知錯誤'));
            }
            
            // 隱藏載入中
            hideLoading();
        })
        .catch(error => {
            console.error('保存食品資料失敗:', error);
            alert('保存食品資料失敗，請重試');
            hideLoading();
        });
    }
    
    /**
     * 載入即將到期食品列表
     */
    function loadExpiringFoodList() {
        console.log("載入即將到期食品列表");
        
        // 顯示載入中
        showLoading('載入即將到期食品列表中...');
        
        // 發送請求
        fetch('/api/expiring-food')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("即將到期食品列表載入成功:", data.food_items);
                    console.log("從後端獲取即將到期食品列表:", data.food_items);
                    
                    // 更新表格
                    updateFoodTable(expiringTableBody, data.food_items);
                    
                    // 更新儀表板
                    updateDashboard();
                } else {
                    console.error("即將到期食品列表載入失敗:", data.error);
                    alert('載入即將到期食品列表失敗：' + (data.error || '未知錯誤'));
                }
                
                // 隱藏載入中
                hideLoading();
            })
            .catch(error => {
                console.error('載入即將到期食品列表失敗:', error);
                alert('載入即將到期食品列表失敗，請重試');
                hideLoading();
            });
    }
    
    /**
     * 載入所有食品列表
     */
    function loadAllFoodList() {
        console.log("載入所有食品列表");
        
        // 顯示載入中
        showLoading('載入所有食品列表中...');
        
        // 發送請求
        fetch('/api/food-list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("所有食品列表載入成功:", data.food_items);
                    console.log("從後端獲取所有食品列表:", data.food_items);
                    
                    // 更新表格
                    updateFoodTable(allTableBody, data.food_items);
                    
                    // 更新儀表板
                    updateDashboard();
                } else {
                    console.error("所有食品列表載入失敗:", data.error);
                    alert('載入所有食品列表失敗：' + (data.error || '未知錯誤'));
                }
                
                // 隱藏載入中
                hideLoading();
            })
            .catch(error => {
                console.error('載入所有食品列表失敗:', error);
                alert('載入所有食品列表失敗，請重試');
                hideLoading();
            });
    }
    
    /**
     * 新增：載入分類統計
     */
    function loadCategoryStats() {
        console.log("載入分類統計");
        
        // 發送請求
        fetch('/api/food-stats')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("分類統計載入成功:", data.stats);
                    
                    // 更新分類統計
                    updateCategoryStats(data.stats);
                    
                    // 更新儀表板
                    updateDashboard(data.stats);
                } else {
                    console.error("分類統計載入失敗:", data.error);
                }
            })
            .catch(error => {
                console.error('載入分類統計失敗:', error);
            });
    }
    
    /**
     * 新增：更新分類統計
     * @param {Object} stats - 統計數據
     */
    function updateCategoryStats(stats) {
        console.log("更新分類統計:", stats);
        
        // 更新分類篩選選單
        if (categoryFilterSelect) {
            // 保存當前選擇的值
            const currentValue = categoryFilterSelect.value;
            
            // 清空選單，保留第一個選項（全部）
            while (categoryFilterSelect.options.length > 1) {
                categoryFilterSelect.remove(1);
            }
            
            // 添加分類選項
            if (stats && stats.category_counts) {
                Object.keys(stats.category_counts).sort().forEach(category => {
                    const count = stats.category_counts[category];
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = `${category} (${count})`;
                    categoryFilterSelect.appendChild(option);
                });
            }
            
            // 恢復選擇的值
            if (currentValue) {
                categoryFilterSelect.value = currentValue;
            }
        }
    }
    
    /**
     * 新增：按分類篩選食品列表
     * @param {string} category - 分類名稱
     */
    function filterFoodListByCategory(category) {
        console.log("按分類篩選食品列表:", category);
        
        // 獲取所有食品行
        const expiringRows = expiringTableBody ? expiringTableBody.querySelectorAll('tr') : [];
        const allRows = allTableBody ? allTableBody.querySelectorAll('tr') : [];
        
        // 篩選即將到期清單
        expiringRows.forEach(row => {
            const rowCategory = row.dataset.category;
            if (category === 'all' || rowCategory === category) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        // 篩選所有食品清單
        allRows.forEach(row => {
            const rowCategory = row.dataset.category;
            if (category === 'all' || rowCategory === category) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    /**
     * 更新食品表格
     * @param {HTMLElement} tableBody - 表格主體元素
     * @param {Array} foodItems - 食品資料列表
     */
    function updateFoodTable(tableBody, foodItems) {
        console.log("更新食品表格，數量:", foodItems.length);
        console.log("在 updateFoodTable 中接收到的食品項目:", foodItems);
        
        if (!tableBody) {
            console.error("找不到表格主體元素");
            return;
        }
        
        // 清空表格
        tableBody.innerHTML = '';
        
        // 如果沒有資料，顯示空訊息
        if (foodItems.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="8" class="text-center">沒有食品記錄</td>
            `;
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // 添加每一行
        foodItems.forEach(item => {
            const row = document.createElement('tr');
            
            // 設置資料屬性，用於篩選
            row.dataset.category = item.category;
            
            // 設置行樣式
            if (item.status === 'expired') {
                row.className = 'table-danger';
            } else if (item.status === 'today') {
                row.className = 'table-warning';
            } else if (item.status === 'soon') {
                row.className = 'table-info';
            }
            
            // 設置行內容
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.category || '其他'}</td>
                <td>${item.quantity} ${item.unit}</td>
                <td>${item.expiry_date}</td>
                <td>${item.batch_number || '-'}</td>
                <td>${item.notes || '-'}</td>
                <td>
                    ${item.days_remaining < 0 ? `<span class="badge bg-danger">${item.days_remaining} 天</span>` :
                      item.days_remaining === 0 ? `<span class="badge bg-warning">今天到期</span>` :
                      `<span class="badge bg-${item.days_remaining <= 7 ? 'warning' : 'info'}">${item.days_remaining} 天</span>`}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${item.id}" aria-label="編輯食品">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            `;
            
            // 添加編輯按鈕事件
            const editBtn = row.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    editFood(item.id);
                });
            }
            
            tableBody.appendChild(row);
        });
    }

    /**
     * 編輯食品資料
     * @param {number} id - 食品ID
     */
    function editFood(id) {
        console.log("編輯食品資料，ID:", id);
        
        // 顯示載入中
        showLoading('載入食品資料中...');
        
        // 發送請求獲取食品資料
        fetch('/api/food-list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 查找對應ID的食品資料
                    const foodItem = data.food_items.find(item => item.id === id);
                    
                    if (foodItem) {
                        // 填充表單
                        document.getElementById('foodId').value = foodItem.id;
                        document.getElementById('barcode').value = foodItem.barcode || '';
                        document.getElementById('name').value = foodItem.name;
                        document.getElementById('expiryDate').value = foodItem.expiry_date;
                        document.getElementById('batchNumber').value = foodItem.batch_number || '';
                        document.getElementById('imagePath').value = foodItem.image_path || '';
                        document.getElementById('notes').value = foodItem.notes || '';
                        document.getElementById('category').value = foodItem.category || '其他';
                        document.getElementById('quantity').value = foodItem.quantity || 1;
                        document.getElementById('unit').value = foodItem.unit || '個';
                        
                        // 滾動到表單
                        foodForm.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        console.error("找不到ID為", id, "的食品資料");
                        alert('找不到對應的食品資料');
                    }
                } else {
                    console.error("載入食品資料失敗:", data.error);
                    alert('載入食品資料失敗：' + (data.error || '未知錯誤'));
                }
                
                // 隱藏載入中
                hideLoading();
            })
            .catch(error => {
                console.error('載入食品資料失敗:', error);
                alert('載入食品資料失敗，請重試');
            });
    }

    /**
     * 刪除食品資料
     * @param {number} id - 食品ID
     */
    function deleteFood(id) {
        console.log("刪除食品資料，ID:", id);
        
        // 確認是否刪除
        if (!confirm('確定要刪除此食品資料嗎？')) {
            return;
        }
        
        // 顯示載入中
        showLoading('刪除食品資料中...');
        
        // 發送刪除請求
        fetch(`/api/delete-food/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("食品資料刪除成功");
                
                // 重新載入食品列表
                loadExpiringFoodList();
                loadAllFoodList();
                
                // 更新儀表板
                updateDashboard();
                
                // 顯示成功訊息
                alert('食品資料已成功刪除');
            } else {
                console.error("食品資料刪除失敗:", data.error);
                alert('刪除食品資料失敗：' + (data.error || '未知錯誤'));
            }
            
            // 隱藏載入中
            hideLoading();
        })
        .catch(error => {
            console.error('刪除食品資料失敗:', error);
            alert('刪除食品資料失敗，請重試');
        });
    }

    /**
     * 更新儀表板
     * @param {Object} stats - 統計數據（可選）
     */
    function updateDashboard(stats) {
        console.log("更新儀表板");
        
        // 如果沒有提供統計數據，則獲取統計數據
        if (!stats) {
            fetch('/api/food-stats')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateDashboardUI(data.stats);
                    } else {
                        console.error('獲取統計數據失敗:', data.error);
                    }
                })
                .catch(error => {
                    console.error('獲取統計數據失敗:', error);
                });
        } else {
            updateDashboardUI(stats);
        }
    }

    /**
     * 更新儀表板UI
     * @param {Object} stats - 統計數據
     */
    function updateDashboardUI(stats) {
        console.log("更新儀表板UI:", stats);
        
        // 更新總食品數量
        const totalFoodCount = document.getElementById('totalFoodCount');
        if (totalFoodCount) {
            totalFoodCount.textContent = stats.total_count;
        }
        
        // 更新即將到期數量
        const expiringFoodCount = document.getElementById('expiring-count');
        if (expiringFoodCount) {
            expiringFoodCount.textContent = stats.expiring_count;
        }
        
        // 更新已過期數量
        const expiredFoodCount = document.getElementById('expiredFoodCount');
        if (expiredFoodCount) {
            expiredFoodCount.textContent = stats.expired_count;
        }
        
        // 更新分類統計圖表
        updateCategoryChart(stats.category_counts);
    }

    /**
     * 新增：更新分類統計圖表
     * @param {Object} categoryCounts - 分類統計數據
     */
    function updateCategoryChart(categoryCounts) {
        console.log("更新分類統計圖表:", categoryCounts);
        
        // 檢查是否有圖表容器
        const chartContainer = document.getElementById('categoryChart');
        if (!chartContainer) {
            return;
        }
        
        // 準備圖表數據
        const categories = Object.keys(categoryCounts);
        const counts = categories.map(cat => categoryCounts[cat]);
        
        // 使用Chart.js繪製圖表
        if (window.categoryChartInstance) {
            window.categoryChartInstance.destroy();
        }
        
        const ctx = chartContainer.getContext('2d');
        window.categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                        '#FF9F40', '#8AC249', '#EA526F', '#23B5D3', '#279AF1',
                        '#7E77F9', '#F49D37', '#2E294E', '#1B998B', '#C5D86D'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: '食品分類統計'
                    }
                }
            }
        });
    }
    
    /**
     * 顯示載入中
     * @param {string} message - 載入訊息
     */
    function showLoading(message) {
        console.log("顯示載入中:", message);
        
        if (loadingOverlay && loadingMessage) {
            loadingMessage.textContent = message || '載入中...';
            loadingOverlay.style.display = 'flex';
        }
    }
    
    /**
     * 隱藏載入中
     */
    function hideLoading() {
        console.log("隱藏載入中");
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
});
