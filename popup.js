document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const domainElement = document.getElementById('domain'); // 显示域名的元素
    const sourceCodeElement = document.getElementById('sourceCode'); // 显示源码的元素
    const linkTableBody = document.getElementById('linkTable').getElementsByTagName('tbody')[0]; // 链接表格的tbody
    const feedbackElement = document.getElementById('feedback'); // 反馈信息的元素

    // 显示正在获取源码的提示
    sourceCodeElement.textContent = '正在获取源码...';

    // 获取当前活动标签的信息
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const url = tabs[0].url; // 当前标签的URL
        const domain = new URL(url).hostname; // 提取域名
        domainElement.textContent = domain; // 显示域名

        // 根据域名设置不同的选择器
        const selectorMap = {
            'fofa.info': {
                "url": '.hsxa-host a', // 选择器示例
                "IP": "a.hsxa-jump-a[style='display:none;']",
                "PORT": "a.hsxa-port",
            },
            'www.shodan.io': {
                'domain': '.text-dark strong', // 选择器示例
                'url': 'a.title.text-dark',
            },
            'quake.360.net': {
                'url': 'span', // 选择器示例
            },
            'hunter.qianxin.com': {
                '链接1': '.copy_btn span', // 选择器示例
            },
        };

        const linkSelectors = selectorMap[domain] || {}; // 获取当前域名对应的选择器

        // 请求网页源码
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不是 OK，状态码: ' + response.status); // 检查响应状态
                }
                return response.text(); // 返回响应文本
            })
            .then(sourceHTML => {
                sourceCodeElement.textContent = sourceHTML; // 显示获取的源码

                const parser = new DOMParser(); // 创建DOM解析器
                const doc = parser.parseFromString(sourceHTML, 'text/html'); // 解析HTML

                populateTable(doc, linkSelectors); // 填充表格
            })
            .catch(error => {
                sourceCodeElement.textContent = '请求失败: ' + error.message; // 处理请求错误
            });
    });

    // 填充表格函数
    function populateTable(doc, linkSelectors) {
        linkTableBody.innerHTML = ''; // 清空现有表格内容
    
        const headers = []; // 存储有效的头部名称
        const rowData = []; // 存储行数据
    
        // 遍历选择器，检查内容
        for (const linkName in linkSelectors) {
            const selector = linkSelectors[linkName]; // 获取当前选择器
            const links = doc.querySelectorAll(selector); // 选择所有匹配的链接
    
            // 检查是否有内容
            if (links.length > 0) {
                headers.push(linkName); // 记录有效的头部名称
    
                links.forEach((link, index) => {
                    const linkText = link.textContent.trim(); // 获取链接文本
                    if (linkText) {
                        if (!rowData[index]) {
                            rowData[index] = {}; // 新建对象以存储该行数据
                        }
                        rowData[index][linkName] = linkText; // 使用链接名称作为键
                    }
                });
            }
        }
    
        // 检查是否有匹配的链接
        if (headers.length === 0) {
            feedbackElement.textContent = '没有找到匹配的链接。'; // 提示消息
            return; // 退出函数，不生成表格
        }
    
        // 创建表头行
        const headerRow = linkTableBody.insertRow(); // 创建表头行
    
        // 添加序号列标题
        const serialHeader = document.createElement('th');
        serialHeader.textContent = '序号';
        headerRow.appendChild(serialHeader);
    
        // 动态生成表头
        headers.forEach(linkName => {
            const th = document.createElement('th');
            th.textContent = linkName; // 设置表头名称
            th.style.cursor = 'pointer'; // 设置光标样式为指针
    
            // 使用闭包保存当前列索引
            const columnIndex = headers.indexOf(linkName); // 当前索引
            th.addEventListener('click', () => {
                const columnData = getColumnData(columnIndex + 1); // 获取对应的数据
                copyToClipboard(columnData, linkName); // 复制数据到剪贴板
            });
    
            headerRow.appendChild(th); // 添加表头到行中
        });
    
        // 动态生成表格行
        rowData.forEach((data, rowIndex) => {
            const dataRow = linkTableBody.insertRow(); // 创建新行
            const serialCell = dataRow.insertCell(); // 添加序号单元格
            serialCell.textContent = rowIndex + 1; // 序号从1开始
    
            headers.forEach(linkName => {
                const cell = dataRow.insertCell(); // 添加新的单元格
                cell.textContent = data[linkName] || ''; // 添加提取的链接文本
            });
        });
    }

    // 获取指定列的数据
    function getColumnData(columnIndex) {
        const columnData = [];
        const rows = linkTableBody.rows; // 获取所有行

        for (let i = 1; i < rows.length; i++) {
            const cell = rows[i].cells[columnIndex]; // 找到对应列的单元格
            if (cell) {
                columnData.push(cell.textContent.trim()); // 获取单元格文本
            } else {
                console.warn(`第${i}行第${columnIndex}列没有找到单元格`); // 警告信息
            }
        }

        console.log('准备复制的列数据:', columnData); // 调试信息
        return columnData; // 返回列数据
    }

    // 复制数据到剪贴板
    function copyToClipboard(columnData, columnName) {
        if (columnData.length === 0) {
            feedbackElement.textContent = '没有可复制的数据。'; // 提示没有数据
            return;
        }

        const textToCopy = columnData.join('\n'); // 将数据合并为文本
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                feedbackElement.textContent = `已复制 ${columnName} 列的数据！`; // 反馈成功
            })
            .catch(err => {
                console.error('复制失败:', err); // 处理复制失败
                feedbackElement.textContent = '复制失败！请检查权限设置。'; // 提示失败信息
            });
    }

    // 复制源码按钮点击事件
    const copySourceButton = document.getElementById('copySourceButton'); // 获取复制源码按钮
    copySourceButton.addEventListener('click', () => {
        const sourceText = sourceCodeElement.textContent; // 获取源码文本
        if (sourceText) {
            navigator.clipboard.writeText(sourceText)
                .then(() => {
                    feedbackElement.textContent = '源码已复制！'; // 反馈成功
                })
                .catch(err => {
                    console.error('复制失败:', err); // 处理复制失败
                    feedbackElement.textContent = '复制失败！请检查权限设置。'; // 提示失败信息
                });
        } else {
            feedbackElement.textContent = '没有可复制的源码。'; // 提示没有源码
        }
    });
});
