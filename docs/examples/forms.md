# PDF 表单处理

本示例展示如何使用 PDF.js 处理 PDF 表单，包括表单字段识别、数据填充、表单验证、数据提取和表单提交等功能。

## 完整示例

### HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF.js 表单处理示例</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 20px;
        }
        
        .pdf-viewer {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .form-panel {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-height: 800px;
            overflow-y: auto;
        }
        
        .controls {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .controls button {
            margin-right: 10px;
            margin-bottom: 5px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #007bff;
            color: white;
            cursor: pointer;
        }
        
        .controls button:hover {
            background: #0056b3;
        }
        
        .controls button:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        
        .controls button.success {
            background: #28a745;
        }
        
        .controls button.warning {
            background: #ffc107;
            color: #212529;
        }
        
        .controls button.danger {
            background: #dc3545;
        }
        
        .page-info {
            margin: 0 15px;
            font-weight: bold;
        }
        
        .form-mode {
            margin-top: 10px;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .form-mode label {
            font-weight: bold;
        }
        
        .form-mode select {
            padding: 5px;
            border-radius: 3px;
            border: 1px solid #ddd;
        }
        
        #pdf-container {
            position: relative;
            display: inline-block;
            margin: 20px auto;
        }
        
        #pdf-canvas {
            display: block;
            border: 1px solid #ddd;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .annotation-layer {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            pointer-events: none;
        }
        
        .annotation-layer > section {
            position: absolute;
            pointer-events: auto;
        }
        
        /* 表单字段样式 */
        .textWidgetAnnotation input,
        .textWidgetAnnotation textarea {
            width: 100%;
            height: 100%;
            border: 1px solid #007bff;
            border-radius: 2px;
            padding: 2px 4px;
            font-size: 12px;
            background: rgba(255, 255, 255, 0.9);
        }
        
        .textWidgetAnnotation input:focus,
        .textWidgetAnnotation textarea:focus {
            outline: none;
            border-color: #0056b3;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        .checkboxWidgetAnnotation input {
            width: 100%;
            height: 100%;
            cursor: pointer;
        }
        
        .radioButtonWidgetAnnotation input {
            width: 100%;
            height: 100%;
            cursor: pointer;
        }
        
        .choiceWidgetAnnotation select {
            width: 100%;
            height: 100%;
            border: 1px solid #007bff;
            border-radius: 2px;
            font-size: 12px;
            background: rgba(255, 255, 255, 0.9);
        }
        
        .buttonWidgetAnnotation {
            cursor: pointer;
            background: #007bff;
            color: white;
            border: 1px solid #0056b3;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }
        
        .buttonWidgetAnnotation:hover {
            background: #0056b3;
        }
        
        .signatureWidgetAnnotation {
            border: 2px dashed #007bff;
            background: rgba(0, 123, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #007bff;
            cursor: pointer;
        }
        
        .form-field {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .form-field .field-name {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .form-field .field-type {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        
        .form-field .field-value {
            margin-bottom: 8px;
        }
        
        .form-field .field-value input,
        .form-field .field-value textarea,
        .form-field .field-value select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .form-field .field-value input:focus,
        .form-field .field-value textarea:focus,
        .form-field .field-value select:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        .form-field .field-properties {
            font-size: 12px;
            color: #6c757d;
            margin-top: 8px;
        }
        
        .form-field .field-properties span {
            display: inline-block;
            margin-right: 15px;
        }
        
        .form-field.required {
            border-left: 4px solid #dc3545;
        }
        
        .form-field.readonly {
            background: #e9ecef;
        }
        
        .form-stats {
            background: #e9ecef;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .form-stats .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .form-stats .stat-item:last-child {
            margin-bottom: 0;
        }
        
        .validation-results {
            margin-top: 15px;
        }
        
        .validation-item {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .validation-item.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .validation-item.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        .validation-item.warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .error {
            color: #dc3545;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        
        @media (max-width: 1200px) {
            .container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- PDF 查看器 -->
        <div class="pdf-viewer">
            <h1>PDF 表单处理示例</h1>
            
            <!-- 文件选择 -->
            <div class="controls">
                <input type="file" id="file-input" accept=".pdf" />
                <button onclick="loadSampleForm()">加载示例表单</button>
                
                <!-- 页面控制 -->
                <div style="margin-top: 10px;">
                    <button id="prev-page" onclick="prevPage()">上一页</button>
                    <span class="page-info">
                        第 <span id="current-page">1</span> 页，共 <span id="total-pages">0</span> 页
                    </span>
                    <button id="next-page" onclick="nextPage()">下一页</button>
                </div>
                
                <!-- 表单操作 -->
                <div class="form-mode">
                    <button onclick="fillSampleData()" class="success">填充示例数据</button>
                    <button onclick="clearFormData()" class="warning">清空表单</button>
                    <button onclick="validateForm()" class="success">验证表单</button>
                    <button onclick="exportFormData()" class="success">导出数据</button>
                    <button onclick="importFormData()" class="warning">导入数据</button>
                </div>
            </div>
            
            <!-- 错误信息 -->
            <div id="error-message" class="error" style="display: none;"></div>
            
            <!-- PDF 渲染区域 -->
            <div id="loading" class="loading">请选择或加载 PDF 表单文件</div>
            <div id="pdf-container" style="display: none;">
                <canvas id="pdf-canvas"></canvas>
                <div id="annotation-layer" class="annotation-layer"></div>
            </div>
        </div>
        
        <!-- 表单面板 -->
        <div class="form-panel">
            <h2>表单字段</h2>
            
            <!-- 表单统计 -->
            <div id="form-stats" class="form-stats" style="display: none;">
                <div class="stat-item">
                    <span>总字段数:</span>
                    <strong id="total-fields">0</strong>
                </div>
                <div class="stat-item">
                    <span>文本字段:</span>
                    <strong id="text-fields">0</strong>
                </div>
                <div class="stat-item">
                    <span>选择字段:</span>
                    <strong id="choice-fields">0</strong>
                </div>
                <div class="stat-item">
                    <span>按钮字段:</span>
                    <strong id="button-fields">0</strong>
                </div>
                <div class="stat-item">
                    <span>必填字段:</span>
                    <strong id="required-fields">0</strong>
                </div>
            </div>
            
            <!-- 控制按钮 -->
            <div class="controls">
                <button onclick="loadCurrentPageFields()">加载当前页字段</button>
                <button onclick="loadAllFields()">加载全部字段</button>
                <button onclick="focusNextField()">下一个字段</button>
            </div>
            
            <!-- 验证结果 -->
            <div id="validation-results" class="validation-results" style="display: none;"></div>
            
            <!-- 表单字段列表 -->
            <div id="form-fields" class="form-fields">
                <div class="loading">暂无表单字段</div>
            </div>
        </div>
    </div>
    
    <!-- 隐藏的文件输入用于导入 -->
    <input type="file" id="import-input" accept=".json" style="display: none;" />
    
    <!-- 引入 PDF.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
        // 配置 PDF.js Worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // 全局变量
        let pdfDoc = null;
        let currentPage = 1;
        let currentPageProxy = null;
        let allFormFields = [];
        let currentFormFields = [];
        let formFieldElements = {};
        let currentFieldIndex = 0;
        
        // DOM 元素
        const canvas = document.getElementById('pdf-canvas');
        const ctx = canvas.getContext('2d');
        const annotationLayer = document.getElementById('annotation-layer');
        const fileInput = document.getElementById('file-input');
        const importInput = document.getElementById('import-input');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error-message');
        const pdfContainer = document.getElementById('pdf-container');
        
        // 文件输入处理
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type === 'application/pdf') {
                loadPDFFromFile(file);
            } else {
                showError('请选择有效的 PDF 文件');
            }
        });
        
        // 导入文件处理
        importInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        applyFormData(data);
                    } catch (error) {
                        showError('导入数据格式错误: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        });
        
        // 从文件加载 PDF
        function loadPDFFromFile(file) {
            const fileReader = new FileReader();
            
            fileReader.onload = function() {
                const typedArray = new Uint8Array(this.result);
                loadPDF(typedArray);
            };
            
            fileReader.readAsArrayBuffer(file);
        }
        
        // 加载示例表单
        function loadSampleForm() {
            // 这里可以加载一个包含表单的示例 PDF
            const sampleFormUrl = 'https://www.w3.org/WAI/WCAG21/working-examples/pdf-form/form.pdf';
            loadPDF(sampleFormUrl);
        }
        
        // 加载 PDF 文档
        function loadPDF(source) {
            showLoading('正在加载 PDF...');
            hideError();
            
            const loadingTask = pdfjsLib.getDocument(source);
            
            loadingTask.promise.then(function(pdf) {
                pdfDoc = pdf;
                currentPage = 1;
                allFormFields = [];
                formFieldElements = {};
                
                hideLoading();
                showPDFContainer();
                
                document.getElementById('total-pages').textContent = pdf.numPages;
                
                renderPage(currentPage);
                updatePageControls();
                
            }).catch(function(error) {
                hideLoading();
                showError('加载 PDF 时发生错误: ' + error.message);
            });
        }
        
        // 渲染指定页面
        function renderPage(pageNum) {
            if (!pdfDoc) return;
            
            showLoading('正在渲染页面...');
            
            pdfDoc.getPage(pageNum).then(function(page) {
                currentPageProxy = page;
                
                const scale = 1.5;
                const viewport = page.getViewport({ scale: scale });
                
                // 设置 Canvas 尺寸
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // 设置注释层尺寸
                annotationLayer.style.width = viewport.width + 'px';
                annotationLayer.style.height = viewport.height + 'px';
                
                // 渲染页面
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                
                // 同时渲染表单字段
                renderFormFields(page, viewport);
                
                return renderTask.promise;
                
            }).then(function() {
                hideLoading();
                
            }).catch(function(error) {
                hideLoading();
                showError('渲染页面时发生错误: ' + error.message);
            });
        }
        
        // 渲染表单字段
        function renderFormFields(page, viewport) {
            page.getAnnotations({ intent: 'display' }).then(function(annotations) {
                // 过滤出表单字段
                const formFields = annotations.filter(function(annotation) {
                    return annotation.fieldType !== undefined;
                });
                
                currentFormFields = formFields;
                
                // 清空注释层
                annotationLayer.innerHTML = '';
                
                if (formFields.length === 0) {
                    return;
                }
                
                // 创建表单字段元素
                formFields.forEach(function(field, index) {
                    const fieldElement = createFormFieldElement(field, viewport, index);
                    if (fieldElement) {
                        annotationLayer.appendChild(fieldElement);
                        formFieldElements[field.fieldName || index] = fieldElement;
                    }
                });
                
                updateFormStats();
                
            }).catch(function(error) {
                console.error('渲染表单字段时发生错误:', error);
            });
        }
        
        // 创建表单字段元素
        function createFormFieldElement(field, viewport, index) {
            if (!field.rect || field.rect.length < 4) {
                return null;
            }
            
            const rect = field.rect;
            const element = document.createElement('section');
            
            // 计算位置和尺寸
            const left = Math.min(rect[0], rect[2]);
            const top = viewport.height - Math.max(rect[1], rect[3]);
            const width = Math.abs(rect[2] - rect[0]);
            const height = Math.abs(rect[3] - rect[1]);
            
            element.style.left = left + 'px';
            element.style.top = top + 'px';
            element.style.width = width + 'px';
            element.style.height = height + 'px';
            
            // 设置字段类型样式
            const fieldType = field.fieldType;
            element.className = getFieldTypeClassName(fieldType);
            element.setAttribute('data-field-name', field.fieldName || index);
            element.setAttribute('data-field-type', fieldType);
            
            // 创建具体的表单控件
            const control = createFormControl(field);
            if (control) {
                element.appendChild(control);
            }
            
            return element;
        }
        
        // 获取字段类型的 CSS 类名
        function getFieldTypeClassName(fieldType) {
            const classNames = {
                'Tx': 'textWidgetAnnotation',
                'Ch': 'choiceWidgetAnnotation',
                'Btn': 'buttonWidgetAnnotation',
                'Sig': 'signatureWidgetAnnotation'
            };
            
            return classNames[fieldType] || 'unknownWidgetAnnotation';
        }
        
        // 创建表单控件
        function createFormControl(field) {
            const fieldType = field.fieldType;
            const fieldName = field.fieldName;
            const fieldValue = field.fieldValue || '';
            
            let control = null;
            
            switch (fieldType) {
                case 'Tx': // 文本字段
                    if (field.multiLine) {
                        control = document.createElement('textarea');
                        control.rows = 3;
                    } else {
                        control = document.createElement('input');
                        control.type = field.password ? 'password' : 'text';
                    }
                    control.value = fieldValue;
                    control.placeholder = field.alternativeText || '';
                    break;
                    
                case 'Ch': // 选择字段
                    if (field.combo) {
                        control = document.createElement('select');
                        if (field.options) {
                            field.options.forEach(function(option) {
                                const optionElement = document.createElement('option');
                                optionElement.value = option.exportValue || option.displayValue;
                                optionElement.textContent = option.displayValue;
                                if (option.exportValue === fieldValue) {
                                    optionElement.selected = true;
                                }
                                control.appendChild(optionElement);
                            });
                        }
                    } else {
                        // 列表框（暂时用 select 代替）
                        control = document.createElement('select');
                        control.multiple = field.multiSelect;
                        if (field.options) {
                            field.options.forEach(function(option) {
                                const optionElement = document.createElement('option');
                                optionElement.value = option.exportValue || option.displayValue;
                                optionElement.textContent = option.displayValue;
                                control.appendChild(optionElement);
                            });
                        }
                    }
                    break;
                    
                case 'Btn': // 按钮字段
                    if (field.checkBox || field.radioButton) {
                        control = document.createElement('input');
                        control.type = field.checkBox ? 'checkbox' : 'radio';
                        control.name = fieldName;
                        control.checked = fieldValue === 'Yes' || fieldValue === 'On';
                    } else {
                        control = document.createElement('button');
                        control.textContent = field.alternativeText || '按钮';
                        control.addEventListener('click', function() {
                            handleButtonClick(field);
                        });
                    }
                    break;
                    
                case 'Sig': // 签名字段
                    control = document.createElement('div');
                    control.textContent = '点击签名';
                    control.addEventListener('click', function() {
                        handleSignatureClick(field);
                    });
                    break;
                    
                default:
                    control = document.createElement('div');
                    control.textContent = '未知字段类型';
            }
            
            if (control) {
                control.setAttribute('data-field-name', fieldName);
                
                // 设置字段属性
                if (field.readOnly) {
                    control.disabled = true;
                }
                
                if (field.required) {
                    control.required = true;
                }
                
                // 添加值变化监听
                if (control.tagName !== 'BUTTON' && control.tagName !== 'DIV') {
                    control.addEventListener('change', function() {
                        updateFieldValue(fieldName, this.value || this.checked);
                    });
                    
                    control.addEventListener('input', function() {
                        updateFieldValue(fieldName, this.value || this.checked);
                    });
                }
            }
            
            return control;
        }
        
        // 处理按钮点击
        function handleButtonClick(field) {
            console.log('按钮点击:', field.fieldName);
            
            // 这里可以添加按钮的具体处理逻辑
            if (field.actions && field.actions.length > 0) {
                field.actions.forEach(function(action) {
                    console.log('执行动作:', action);
                });
            }
        }
        
        // 处理签名点击
        function handleSignatureClick(field) {
            console.log('签名字段点击:', field.fieldName);
            
            // 这里可以打开签名对话框或处理签名逻辑
            const signature = prompt('请输入签名文本:');
            if (signature) {
                updateFieldValue(field.fieldName, signature);
                
                // 更新显示
                const element = formFieldElements[field.fieldName];
                if (element) {
                    const control = element.querySelector('div');
                    if (control) {
                        control.textContent = signature;
                        control.style.backgroundColor = '#d4edda';
                    }
                }
            }
        }
        
        // 更新字段值
        function updateFieldValue(fieldName, value) {
            // 更新内部数据
            const field = currentFormFields.find(f => f.fieldName === fieldName);
            if (field) {
                field.fieldValue = value;
            }
            
            // 更新全局字段数据
            const globalField = allFormFields.find(f => f.fieldName === fieldName);
            if (globalField) {
                globalField.fieldValue = value;
            }
            
            console.log('字段值更新:', fieldName, '=', value);
        }
        
        // 加载当前页字段
        function loadCurrentPageFields() {
            if (!currentPageProxy) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            displayFormFieldsList(currentFormFields, currentPage);
        }
        
        // 加载全部字段
        function loadAllFields() {
            if (!pdfDoc) {
                showError('请先加载 PDF 文档');
                return;
            }
            
            showLoading('正在加载全部字段...');
            
            const promises = [];
            
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                promises.push(
                    pdfDoc.getPage(i).then(function(page) {
                        return page.getAnnotations({ intent: 'display' }).then(function(annotations) {
                            const formFields = annotations.filter(function(annotation) {
                                return annotation.fieldType !== undefined;
                            });
                            
                            return {
                                pageNum: i,
                                fields: formFields
                            };
                        });
                    })
                );
            }
            
            Promise.all(promises).then(function(pages) {
                allFormFields = [];
                pages.forEach(function(page) {
                    page.fields.forEach(function(field) {
                        field.pageNum = page.pageNum;
                        allFormFields.push(field);
                    });
                });
                
                displayFormFieldsList(allFormFields);
                hideLoading();
            }).catch(function(error) {
                hideLoading();
                showError('加载全部字段时发生错误: ' + error.message);
            });
        }
        
        // 显示表单字段列表
        function displayFormFieldsList(fields, pageNum = null) {
            const container = document.getElementById('form-fields');
            container.innerHTML = '';
            
            if (fields.length === 0) {
                container.innerHTML = '<div class="loading">暂无表单字段</div>';
                return;
            }
            
            fields.forEach(function(field, index) {
                const fieldDiv = createFormFieldDiv(field, index);
                container.appendChild(fieldDiv);
            });
        }
        
        // 创建表单字段显示元素
        function createFormFieldDiv(field, index) {
            const div = document.createElement('div');
            div.className = 'form-field';
            
            if (field.required) {
                div.classList.add('required');
            }
            
            if (field.readOnly) {
                div.classList.add('readonly');
            }
            
            // 字段名称
            const nameDiv = document.createElement('div');
            nameDiv.className = 'field-name';
            nameDiv.textContent = field.fieldName || `字段 ${index + 1}`;
            
            // 字段类型
            const typeDiv = document.createElement('div');
            typeDiv.className = 'field-type';
            typeDiv.textContent = getFieldTypeDisplayName(field.fieldType);
            
            // 字段值
            const valueDiv = document.createElement('div');
            valueDiv.className = 'field-value';
            
            const control = createFormFieldControl(field);
            if (control) {
                valueDiv.appendChild(control);
            }
            
            // 字段属性
            const propsDiv = document.createElement('div');
            propsDiv.className = 'field-properties';
            
            const props = [];
            if (field.required) props.push('必填');
            if (field.readOnly) props.push('只读');
            if (field.multiLine) props.push('多行');
            if (field.password) props.push('密码');
            if (field.pageNum) props.push(`第 ${field.pageNum} 页`);
            
            props.forEach(function(prop) {
                const span = document.createElement('span');
                span.textContent = prop;
                propsDiv.appendChild(span);
            });
            
            div.appendChild(nameDiv);
            div.appendChild(typeDiv);
            div.appendChild(valueDiv);
            div.appendChild(propsDiv);
            
            // 添加点击事件
            div.addEventListener('click', function() {
                if (field.pageNum && field.pageNum !== currentPage) {
                    currentPage = field.pageNum;
                    renderPage(currentPage);
                    updatePageControls();
                }
                
                // 高亮对应的字段
                setTimeout(function() {
                    const fieldElement = formFieldElements[field.fieldName];
                    if (fieldElement) {
                        fieldElement.style.border = '3px solid #007bff';
                        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        setTimeout(function() {
                            fieldElement.style.border = '';
                        }, 2000);
                    }
                }, 500);
            });
            
            return div;
        }
        
        // 创建表单字段控件（用于侧边栏）
        function createFormFieldControl(field) {
            const fieldType = field.fieldType;
            const fieldValue = field.fieldValue || '';
            
            let control = null;
            
            switch (fieldType) {
                case 'Tx':
                    if (field.multiLine) {
                        control = document.createElement('textarea');
                        control.rows = 3;
                    } else {
                        control = document.createElement('input');
                        control.type = field.password ? 'password' : 'text';
                    }
                    control.value = fieldValue;
                    break;
                    
                case 'Ch':
                    control = document.createElement('select');
                    if (field.options) {
                        field.options.forEach(function(option) {
                            const optionElement = document.createElement('option');
                            optionElement.value = option.exportValue || option.displayValue;
                            optionElement.textContent = option.displayValue;
                            if (option.exportValue === fieldValue) {
                                optionElement.selected = true;
                            }
                            control.appendChild(optionElement);
                        });
                    }
                    break;
                    
                case 'Btn':
                    if (field.checkBox || field.radioButton) {
                        control = document.createElement('input');
                        control.type = field.checkBox ? 'checkbox' : 'radio';
                        control.checked = fieldValue === 'Yes' || fieldValue === 'On';
                    } else {
                        control = document.createElement('button');
                        control.textContent = field.alternativeText || '按钮';
                    }
                    break;
                    
                case 'Sig':
                    control = document.createElement('input');
                    control.type = 'text';
                    control.placeholder = '签名内容';
                    control.value = fieldValue;
                    break;
            }
            
            if (control && control.tagName !== 'BUTTON') {
                control.addEventListener('change', function() {
                    updateFieldValue(field.fieldName, this.value || this.checked);
                    
                    // 同步更新 PDF 上的字段
                    const pdfFieldElement = formFieldElements[field.fieldName];
                    if (pdfFieldElement) {
                        const pdfControl = pdfFieldElement.querySelector('input, textarea, select');
                        if (pdfControl) {
                            if (pdfControl.type === 'checkbox' || pdfControl.type === 'radio') {
                                pdfControl.checked = this.checked;
                            } else {
                                pdfControl.value = this.value;
                            }
                        }
                    }
                });
            }
            
            return control;
        }
        
        // 获取字段类型显示名称
        function getFieldTypeDisplayName(fieldType) {
            const typeNames = {
                'Tx': '文本字段',
                'Ch': '选择字段',
                'Btn': '按钮字段',
                'Sig': '签名字段'
            };
            
            return typeNames[fieldType] || '未知类型';
        }
        
        // 更新表单统计
        function updateFormStats() {
            const stats = {
                total: currentFormFields.length,
                text: 0,
                choice: 0,
                button: 0,
                signature: 0,
                required: 0
            };
            
            currentFormFields.forEach(function(field) {
                switch (field.fieldType) {
                    case 'Tx': stats.text++; break;
                    case 'Ch': stats.choice++; break;
                    case 'Btn': stats.button++; break;
                    case 'Sig': stats.signature++; break;
                }
                
                if (field.required) stats.required++;
            });
            
            document.getElementById('total-fields').textContent = stats.total;
            document.getElementById('text-fields').textContent = stats.text;
            document.getElementById('choice-fields').textContent = stats.choice;
            document.getElementById('button-fields').textContent = stats.button;
            document.getElementById('required-fields').textContent = stats.required;
            
            document.getElementById('form-stats').style.display = stats.total > 0 ? 'block' : 'none';
        }
        
        // 填充示例数据
        function fillSampleData() {
            const sampleData = {
                'name': '张三',
                'email': 'zhangsan@example.com',
                'phone': '13800138000',
                'address': '北京市朝阳区',
                'age': '30',
                'gender': 'male',
                'agree': true,
                'comments': '这是一个测试注释。'
            };
            
            applyFormData(sampleData);
        }
        
        // 应用表单数据
        function applyFormData(data) {
            Object.keys(data).forEach(function(fieldName) {
                const value = data[fieldName];
                
                // 更新 PDF 上的字段
                const pdfFieldElement = formFieldElements[fieldName];
                if (pdfFieldElement) {
                    const control = pdfFieldElement.querySelector('input, textarea, select');
                    if (control) {
                        if (control.type === 'checkbox' || control.type === 'radio') {
                            control.checked = value;
                        } else {
                            control.value = value;
                        }
                        
                        // 触发 change 事件
                        control.dispatchEvent(new Event('change'));
                    }
                }
                
                // 更新侧边栏的字段
                const sidebarControls = document.querySelectorAll(`[data-field-name="${fieldName}"]`);
                sidebarControls.forEach(function(control) {
                    if (control.tagName === 'INPUT' || control.tagName === 'TEXTAREA' || control.tagName === 'SELECT') {
                        if (control.type === 'checkbox' || control.type === 'radio') {
                            control.checked = value;
                        } else {
                            control.value = value;
                        }
                    }
                });
            });
        }
        
        // 清空表单数据
        function clearFormData() {
            if (!confirm('确定要清空所有表单数据吗？')) {
                return;
            }
            
            // 清空 PDF 上的字段
            Object.keys(formFieldElements).forEach(function(fieldName) {
                const element = formFieldElements[fieldName];
                const control = element.querySelector('input, textarea, select');
                if (control) {
                    if (control.type === 'checkbox' || control.type === 'radio') {
                        control.checked = false;
                    } else {
                        control.value = '';
                    }
                    
                    // 触发 change 事件
                    control.dispatchEvent(new Event('change'));
                }
            });
            
            // 清空侧边栏的字段
            const sidebarControls = document.querySelectorAll('#form-fields input, #form-fields textarea, #form-fields select');
            sidebarControls.forEach(function(control) {
                if (control.type === 'checkbox' || control.type === 'radio') {
                    control.checked = false;
                } else {
                    control.value = '';
                }
            });
        }
        
        // 验证表单
        function validateForm() {
            const results = [];
            const fieldsToValidate = allFormFields.length > 0 ? allFormFields : currentFormFields;
            
            fieldsToValidate.forEach(function(field) {
                const result = validateField(field);
                if (result) {
                    results.push(result);
                }
            });
            
            displayValidationResults(results);
        }
        
        // 验证单个字段
        function validateField(field) {
            const fieldName = field.fieldName;
            const fieldValue = field.fieldValue;
            const fieldType = field.fieldType;
            
            // 必填字段验证
            if (field.required && (!fieldValue || fieldValue === '')) {
                return {
                    type: 'error',
                    field: fieldName,
                    message: `字段 "${fieldName}" 是必填项`
                };
            }
            
            // 邮箱格式验证
            if (fieldName && fieldName.toLowerCase().includes('email') && fieldValue) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(fieldValue)) {
                    return {
                        type: 'error',
                        field: fieldName,
                        message: `字段 "${fieldName}" 邮箱格式不正确`
                    };
                }
            }
            
            // 电话号码验证
            if (fieldName && fieldName.toLowerCase().includes('phone') && fieldValue) {
                const phoneRegex = /^1[3-9]\d{9}$/;
                if (!phoneRegex.test(fieldValue)) {
                    return {
                        type: 'warning',
                        field: fieldName,
                        message: `字段 "${fieldName}" 电话号码格式可能不正确`
                    };
                }
            }
            
            // 字段有值的情况
            if (fieldValue && fieldValue !== '') {
                return {
                    type: 'success',
                    field: fieldName,
                    message: `字段 "${fieldName}" 验证通过`
                };
            }
            
            return null;
        }
        
        // 显示验证结果
        function displayValidationResults(results) {
            const container = document.getElementById('validation-results');
            container.innerHTML = '';
            
            if (results.length === 0) {
                container.style.display = 'none';
                return;
            }
            
            container.style.display = 'block';
            
            results.forEach(function(result) {
                const div = document.createElement('div');
                div.className = `validation-item ${result.type}`;
                div.textContent = result.message;
                container.appendChild(div);
            });
        }
        
        // 导出表单数据
        function exportFormData() {
            const fieldsToExport = allFormFields.length > 0 ? allFormFields : currentFormFields;
            
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalFields: fieldsToExport.length,
                    version: '1.0'
                },
                formData: {}
            };
            
            fieldsToExport.forEach(function(field) {
                if (field.fieldName && field.fieldValue !== undefined) {
                    exportData.formData[field.fieldName] = field.fieldValue;
                }
            });
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'form-data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        }
        
        // 导入表单数据
        function importFormData() {
            importInput.click();
        }
        
        // 聚焦下一个字段
        function focusNextField() {
            const fieldElements = Object.values(formFieldElements);
            if (fieldElements.length === 0) return;
            
            currentFieldIndex = (currentFieldIndex + 1) % fieldElements.length;
            const nextField = fieldElements[currentFieldIndex];
            
            if (nextField) {
                const control = nextField.querySelector('input, textarea, select');
                if (control && !control.disabled) {
                    control.focus();
                    
                    // 高亮字段
                    nextField.style.border = '3px solid #28a745';
                    nextField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    setTimeout(function() {
                        nextField.style.border = '';
                    }, 2000);
                }
            }
        }
        
        // 上一页
        function prevPage() {
            if (currentPage <= 1) return;
            currentPage--;
            renderPage(currentPage);
            updatePageControls();
        }
        
        // 下一页
        function nextPage() {
            if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
            currentPage++;
            renderPage(currentPage);
            updatePageControls();
        }
        
        // 更新页面控制按钮状态
        function updatePageControls() {
            document.getElementById('current-page').textContent = currentPage;
            document.getElementById('prev-page').disabled = (currentPage <= 1);
            document.getElementById('next-page').disabled = (!pdfDoc || currentPage >= pdfDoc.numPages);
        }
        
        // 显示/隐藏元素的辅助函数
        function showLoading(message) {
            loadingDiv.textContent = message;
            loadingDiv.style.display = 'block';
            pdfContainer.style.display = 'none';
        }
        
        function hideLoading() {
            loadingDiv.style.display = 'none';
        }
        
        function showPDFContainer() {
            pdfContainer.style.display = 'block';
        }
        
        function showError(message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        function hideError() {
            errorDiv.style.display = 'none';
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', function(event) {
            if (!pdfDoc) return;
            
            switch(event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    if (!event.target.matches('input, textarea, select')) {
                        event.preventDefault();
                        prevPage();
                    }
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    if (!event.target.matches('input, textarea, select')) {
                        event.preventDefault();
                        nextPage();
                    }
                    break;
                case 'Tab':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        focusNextField();
                    }
                    break;
            }
        });
    </script>
</body>
</html>
```

## 核心功能说明

### 1. 表单字段识别

```javascript
// 获取页面表单字段
page.getAnnotations({ intent: 'display' }).then(function(annotations) {
    const formFields = annotations.filter(function(annotation) {
        return annotation.fieldType !== undefined;
    });
    
    formFields.forEach(function(field) {
        console.log({
            name: field.fieldName,        // 字段名称
            type: field.fieldType,        // 字段类型 (Tx, Ch, Btn, Sig)
            value: field.fieldValue,      // 字段值
            required: field.required,     // 是否必填
            readOnly: field.readOnly,     // 是否只读
            rect: field.rect              // 位置矩形
        });
    });
});
```

### 2. 表单字段类型

```javascript
// 字段类型处理
function handleFieldType(field) {
    switch (field.fieldType) {
        case 'Tx':  // 文本字段
            return {
                type: 'text',
                multiLine: field.multiLine,
                password: field.password,
                maxLength: field.maxLen
            };
            
        case 'Ch':  // 选择字段
            return {
                type: 'choice',
                combo: field.combo,           // 下拉框
                multiSelect: field.multiSelect, // 多选
                options: field.options        // 选项列表
            };
            
        case 'Btn': // 按钮字段
            return {
                type: 'button',
                checkBox: field.checkBox,     // 复选框
                radioButton: field.radioButton, // 单选按钮
                pushButton: field.pushButton  // 按钮
            };
            
        case 'Sig': // 签名字段
            return {
                type: 'signature'
            };
    }
}
```

### 3. 表单数据填充

```javascript
// 填充表单数据
function fillFormField(fieldName, value) {
    // 查找字段元素
    const fieldElement = document.querySelector(`[data-field-name="${fieldName}"]`);
    if (!fieldElement) return;
    
    const control = fieldElement.querySelector('input, textarea, select');
    if (!control) return;
    
    // 根据控件类型设置值
    if (control.type === 'checkbox' || control.type === 'radio') {
        control.checked = value;
    } else {
        control.value = value;
    }
    
    // 触发变化事件
    control.dispatchEvent(new Event('change', { bubbles: true }));
}
```

### 4. 表单验证

```javascript
// 表单验证规则
function validateFormField(field) {
    const validators = {
        required: function(value) {
            return value !== null && value !== undefined && value !== '';
        },
        
        email: function(value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        },
        
        phone: function(value) {
            const phoneRegex = /^1[3-9]\d{9}$/;
            return phoneRegex.test(value);
        },
        
        minLength: function(value, minLen) {
            return value && value.length >= minLen;
        },
        
        maxLength: function(value, maxLen) {
            return !value || value.length <= maxLen;
        }
    };
    
    const errors = [];
    
    // 必填验证
    if (field.required && !validators.required(field.fieldValue)) {
        errors.push(`字段 "${field.fieldName}" 是必填项`);
    }
    
    // 长度验证
    if (field.maxLen && !validators.maxLength(field.fieldValue, field.maxLen)) {
        errors.push(`字段 "${field.fieldName}" 超过最大长度 ${field.maxLen}`);
    }
    
    return errors;
}
```

### 5. 表单数据提取

```javascript
// 提取表单数据
function extractFormData(fields) {
    const formData = {};
    const metadata = {
        totalFields: fields.length,
        filledFields: 0,
        requiredFields: 0,
        validationErrors: []
    };
    
    fields.forEach(function(field) {
        const fieldName = field.fieldName;
        const fieldValue = field.fieldValue;
        
        if (fieldName) {
            formData[fieldName] = fieldValue;
            
            if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
                metadata.filledFields++;
            }
            
            if (field.required) {
                metadata.requiredFields++;
            }
            
            // 验证字段
            const errors = validateFormField(field);
            if (errors.length > 0) {
                metadata.validationErrors.push({
                    field: fieldName,
                    errors: errors
                });
            }
        }
    });
    
    return {
        data: formData,
        metadata: metadata
    };
}
```

## 高级功能

### 1. 表单字段计算

```javascript
// 计算字段（如总和、平均值等）
function setupCalculatedFields() {
    const calculationRules = {
        'total': function() {
            const field1 = getFieldValue('amount1') || 0;
            const field2 = getFieldValue('amount2') || 0;
            return parseFloat(field1) + parseFloat(field2);
        },
        
        'average': function() {
            const values = ['score1', 'score2', 'score3'].map(name => {
                return parseFloat(getFieldValue(name)) || 0;
            });
            return values.reduce((a, b) => a + b, 0) / values.length;
        }
    };
    
    // 监听相关字段变化
    Object.keys(calculationRules).forEach(function(targetField) {
        const rule = calculationRules[targetField];
        
        // 当相关字段变化时重新计算
        document.addEventListener('fieldchange', function(event) {
            const newValue = rule();
            setFieldValue(targetField, newValue);
        });
    });
}
```

### 2. 表单数据同步

```javascript
// 表单数据同步到服务器
function syncFormData(formData) {
    return fetch('/api/form/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            formId: getCurrentFormId(),
            data: formData,
            timestamp: new Date().toISOString()
        })
    }).then(function(response) {
        if (!response.ok) {
            throw new Error('保存失败');
        }
        return response.json();
    });
}

// 自动保存
function setupAutoSave() {
    let saveTimeout;
    
    document.addEventListener('fieldchange', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function() {
            const formData = extractFormData(allFormFields);
            syncFormData(formData.data).catch(function(error) {
                console.error('自动保存失败:', error);
            });
        }, 2000); // 2秒后保存
    });
}
```

### 3. 表单模板

```javascript
// 表单模板管理
const formTemplates = {
    'personal-info': {
        name: '个人信息表',
        fields: {
            'name': '张三',
            'email': 'zhangsan@example.com',
            'phone': '13800138000',
            'address': '北京市朝阳区'
        }
    },
    
    'application-form': {
        name: '申请表',
        fields: {
            'applicant': '',
            'date': new Date().toISOString().split('T')[0],
            'reason': '',
            'agree': true
        }
    }
};

function applyTemplate(templateName) {
    const template = formTemplates[templateName];
    if (!template) return;
    
    Object.keys(template.fields).forEach(function(fieldName) {
        const value = template.fields[fieldName];
        fillFormField(fieldName, value);
    });
}
```

## 功能特性

- ✅ 多种表单字段类型支持（文本、选择、按钮、签名）
- ✅ 表单数据填充和提取
- ✅ 表单验证和错误提示
- ✅ 数据导入导出（JSON格式）
- ✅ 表单字段统计和分析
- ✅ 响应式设计和键盘快捷键
- ✅ 自动保存和数据同步
- ✅ 表单模板支持
- ✅ 字段计算和联动
- ✅ 多页面表单处理

## 注意事项

### 1. 表单字段坐标转换

```javascript
// PDF坐标系转换为屏幕坐标系
function convertPDFToScreenCoords(rect, viewport) {
    const left = Math.min(rect[0], rect[2]);
    const top = viewport.height - Math.max(rect[1], rect[3]);
    const width = Math.abs(rect[2] - rect[0]);
    const height = Math.abs(rect[3] - rect[1]);
    
    return { left, top, width, height };
}
```

### 2. 表单字段事件处理

```javascript
// 防止事件冲突
function setupFieldEventHandlers(fieldElement, field) {
    const control = fieldElement.querySelector('input, textarea, select');
    if (!control) return;
    
    // 防止PDF.js默认行为
    fieldElement.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    
    // 自定义事件处理
    control.addEventListener('focus', function() {
        fieldElement.classList.add('focused');
    });
    
    control.addEventListener('blur', function() {
        fieldElement.classList.remove('focused');
    });
}
```

### 3. 性能优化

- 使用虚拟滚动处理大量表单字段
- 延迟加载非当前页面的字段
- 缓存表单数据避免重复计算
- 使用防抖处理频繁的输入事件

### 4. 浏览器兼容性

- 现代浏览器（Chrome 60+、Firefox 55+、Safari 12+）
- 移动端浏览器支持
- 不支持 IE 浏览器

## 相关示例

- [基础渲染](./basic-rendering.md) - PDF基础渲染功能
- [文本提取](./text-extraction.md) - 文本内容提取
- [注释处理](./annotations.md) - 注释和标记处理

## API 参考

- [PDFPageProxy.getAnnotations()](../api/pdf-page-proxy.md#getannotations) - 获取页面注释
- [注释层渲染](../api/annotation-layer.md) - 注释层API
- [表单字段类型](../api/form-fields.md) - 表单字段详细说明