document.addEventListener('DOMContentLoaded', function() {
    const domainElement = document.getElementById('domain');
    const sourceCodeElement = document.getElementById('sourceCode');
    const linkTextsElement = document.getElementById('linkTexts');
    const linkTableBody = document.getElementById('linkTable').getElementsByTagName('tbody')[0];
    const copyButton = document.getElementById('copyButton');
    const feedbackElement = document.getElementById('feedback'); // 获取反馈元素

    // 显示加载指示器
    sourceCodeElement.textContent = '正在获取源码...';
    // linkTextsElement.textContent = '提取成功！';

    // 查询当前活动的标签页
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var url = tabs[0].url; // 获取当前标签页的 URL
        var domain = new URL(url).hostname; // 提取域名
        console.log("当前域名:", domain); // 输出当前域名以进行调试
        domainElement.textContent = domain; // 保存域名到全局变量
        // 使用映射对象配置选择器
        const selectorMap = {
            'fofa.info': '.hsxa-host a',
            'www.shodan.io': 'strong',
            'quake.360.net': 'span',
            'hunter.qianxin.com': 'span',
        };

        // 根据当前域名选择对应的选择器
        const linkSelector = selectorMap[domain] || ''; // 默认选择器为空

        // 使用 fetch 进行网络请求
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不是 OK，状态码: ' + response.status);
                }
                return response.text();
            })
            .then(sourceHTML => {
                sourceCodeElement.textContent = sourceHTML; // 显示源代码

                // 使用 DOMParser 来解析 HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(sourceHTML, 'text/html');

                // 如果选择器不为空，则查找链接并提取文本
                if (linkSelector) {
                    const links = doc.querySelectorAll(linkSelector);
                    const linkTexts = Array.from(links).map(link => link.textContent.trim());

                    // 显示提取的链接文本
                    if (linkTexts.length > 0) {
                        // 将提取的链接文本添加到表格中
                        linkTexts.forEach((text, index) => {
                            const row = linkTableBody.insertRow();
                            const cellIndex = row.insertCell(0); // 添加序号单元格
                            const cellText = row.insertCell(1); // 添加链接文本单元格
                            cellIndex.textContent = index + 1; // 设置序号
                            cellText.textContent = text; // 设置链接文本
                        });
                        linkTextsElement.textContent = '提取成功！';
                    } else {
                        linkTextsElement.textContent = '未找到链接文本。';
                    }
                } else {
                    linkTextsElement.textContent = '未设置选择器，无法提取文本。';
                }
            })
            .catch(error => {
                sourceCodeElement.textContent = '请求失败: ' + error.message; // 显示错误信息
            });
    });

    // 复制按钮的点击事件
    copyButton.addEventListener('click', function() {
        const range = document.createRange();
        range.selectNodeContents(linkTableBody);
        const selection = window.getSelection();
        selection.removeAllRanges(); // 清空当前选择
        selection.addRange(range); // 选择表格内容

        try {
            // 执行复制
            const successful = document.execCommand('copy');
            feedbackElement.textContent = successful ? '复制成功！' : '复制失败！'; // 显示反馈信息
        } catch (err) {
            console.error('复制失败:', err);
            feedbackElement.textContent = '复制失败！'; // 显示反馈信息
        }

        // 清空选择
        selection.removeAllRanges();
    });
});