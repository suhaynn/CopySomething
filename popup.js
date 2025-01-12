document.addEventListener('DOMContentLoaded', function() {
    const app = new App(); // 创建 App 实例
    app.init(); // 初始化应用
});

class App {
    constructor() {
        // 获取 DOM 元素
        this.domainElement = document.getElementById('domain');
        this.titleElement = document.getElementById('title');
        this.linkTableBody = document.getElementById('linkTable').getElementsByTagName('tbody')[0];
        this.feedbackElement = document.getElementById('feedback');
        this.copySourceButton = document.getElementById('copySourceButton');
        this.getinfoButton = document.getElementById('getinfoButton');

        // 定义选择器映射
        this.selectorMap = this.getSelectorMap();
        this.headers = []; // 用于存储表头
    }

    init() {
        chrome.tabs.query({ active: true, currentWindow: true })
            .then(async (tabs) => {
                const tab = tabs[0];
                const url = tab.url; // 获取当前 tab 的 URL
                const domain = new URL(url).hostname; // 获取域名
                const title = tab.title; // 获取页面标题
    
                this.domainElement.textContent = domain; // 显示域名
                this.titleElement.textContent = title; // 显示页面标题
    
                this.geticp(domain);// 获取 ICP 信息
                // 获取页面的 HTML 源代码
                try {
                    const result = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        function: () => document.documentElement.outerHTML
                    });
    
                    if (result && result[0]) {
                        const sourceHTML = result[0].result; // 获取到的 HTML 源代码
                        this.copySourceButton.addEventListener('click', () => this.copyelementId("sourceCode", true, sourceHTML));
                        return this.processSourceCode(sourceHTML); // 处理源码
                    }
                } catch (error) {
                    console.error('执行脚本时出错:', error);
                    this.handleError(error);
                }
            })
            .catch(error => this.handleError(error)); // 处理可能出现的错误
            
    
        // 绑定复制源码按钮的点击事件
        
        this.getinfoButton.addEventListener('click', () => this.extractSensitiveInfo(document));
        this.domainElement.addEventListener('click', () => this.copyelementId('domain'));
        this.titleElement.addEventListener('click', () => this.copyelementId('title'));
    }

    geticp(domain) {
        // 合并路径与数据的数组，每个对象包含选择器、标签和初始值
        const items = [
            { path: "#icp-table > table > tbody > tr:nth-child(1) > td:nth-child(2)", label: 'companyName', value: '' }, // 公司
            { path: "#icp-table > table > tbody > tr:nth-child(2) > td:nth-child(2)", label: 'nature', value: '' }, // 性质
            { path: "#icp-table > table > tbody > tr:nth-child(3) > td:nth-child(2) > span", label: 'recordNumber', value: '' }, // 备案号
            { path: "#tian > table > tbody > tr:nth-child(1) > td:nth-child(1) > span:nth-child(2)", label: 'legalPerson', value: '' }, // 法人代表
            { path: "#tian > table > tbody > tr:nth-child(1) > td:nth-child(2) > span:nth-child(2)", label: 'registeredCapital', value: '' }, // 注册资本
            { path: "#tian > table > tbody > tr:nth-child(2) > td:nth-child(1) > span:nth-child(2)", label: 'industry', value: '' }, // 行业
            { path: "#tian > table > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(2)", label: 'companySize', value: '' }, // 公司规模
            { path: "#tian > table > tbody > tr:nth-child(3) > td:nth-child(3) > span:nth-child(2)", label: 'companyAddress', value: '' }, // 公司地址
            { path: "#icp-table > table > tbody > tr:nth-child(5) > td:nth-child(2) > span", label: 'auditTime', value: '' }, // 审核时间
        ];
    
        const seoItems = [
            { path: "body > div._chinaz-seo-new1.wrapper.mb10 > table > tbody > tr:nth-child(4) > td._chinaz-seo-newh78._chinaz-seo-newinfo > div:nth-child(1) > span:nth-child(1) > i > a", label: 'anotherIP', value: '' } // SEO 信息
        ];
    
        const url1 = `https://icp.aizhan.com/${domain}/`; // 构建第一个请求的 URL
        const url2 = `https://seo.chinaz.com/${domain}/`; // 构建第二个请求的 URL
        console.log(url1);
        
        // 第一个请求
        fetch(url1, {
            method: 'GET',
            headers: {
                'Referer': 'https://www.aizhan.com/' // 添加 Referer 头
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应不正常: ' + response.statusText);
            }
            return response.text(); // 获取响应文本
        })
        .then(dataHtml => {
            const parser = new DOMParser(); // 创建 DOMParser 实例
            const doc = parser.parseFromString(dataHtml, 'text/html'); // 解析 HTML 字符串为文档对象
    
            // 遍历 items 数组，提取值并更新到对应对象中
            items.forEach(item => {
                if (item.path) { // 如果有路径
                    const valueElement = doc.querySelector(item.path); // 使用选择器提取值
                    if (valueElement) {
                        item.value = valueElement.textContent; // 更新对应的 value
                    }
                }
            });
    
            console.log(items); // 打印更新后的 items 数组
    
            // 遍历 items 数组，更新 HTML 元素内容，公司备案
            items.forEach(item => {
                const element = document.getElementById(item.label);
                if (element) {
                    element.innerText = item.value; // 更新元素的文本内容
                    element.addEventListener('click', () => this.copyelementId(item.label));
                }
            });
    
            // 第二个请求
            return fetch(url2, {
                method: 'GET',
                headers: {
                    // 'Cookie': 'userId=1' // 请求头部设置 Cookie
                    'Referer': 'https://www.chinaz.com' // 添加 Referer 头
                }
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应不正常: ' + response.statusText);
            }
            return response.text(); // 获取响应文本
        })
        .then(dataHtml => {
            const parser = new DOMParser(); // 创建 DOMParser 实例
            const doc = parser.parseFromString(dataHtml, 'text/html'); // 解析 HTML 字符串为文档对象
    
            // 遍历 seoItems 数组，提取值并更新到对应对象中
            seoItems.forEach(item => {
                if (item.path) { // 如果有路径
                    const valueElement = doc.querySelector(item.path); // 使用选择器提取值
                    if (valueElement) {
                        item.value = valueElement.textContent; // 更新对应的 value
                    }
                }
            });
    
            console.log(seoItems); // 打印更新后的 seoItems 数组
    
            // 遍历 seoItems 数组，更新 HTML 元素内容，网站IP
            seoItems.forEach(item => {
                const element = document.getElementById(item.label);
                if (element) {
                    element.innerText = item.value; // 更新元素的文本内容
                    element.addEventListener('click', () => this.copyelementId(item.label));
                }
            });
    
        })
        .catch(error => {
            console.error('获取操作出现问题:', error);
        });
    }
    getSelectorMap() {
        return {
            'fofa.info': { // 针对 fofa.info 的选择器
                "域名": '.hsxa-host a',
                "IP": "a.hsxa-jump-a[style='display:none;']",
                "PORT": ".hsxa-fr a.hsxa-port",
                "标题": ".el-tooltip.hsxa-one-line.item",
            },
            'www.shodan.io': { // 针对 www.shodan.io 的选择器
                'domain': '.text-dark strong',
                'url': 'a.title.text-dark',
            },
            'quake.360.net': { // 针对 quake.360.net 的选择器
                '域名': '.item-top-line .copy_btn',
                'IP': 'span.port-line-right-item.ml-10.copy_btn',
                'PORT': 'span.port.common-tag.margin-right8',
                '标题': '.title-line span.ellipse-text',
            },
            'hunter.qianxin.com': { // 针对 hunter.qianxin.com 的选择器
                'IP':'.q-table__row .q-table_1_column_2.is-hidden.q-table__cell .q-popover-wrapper.content.can-click span.q-tooltip',
                '域名': '.q-table__row .q-table_1_column_3.is-hidden.q-table__cell span.q-tooltip',
                '端口': '.q-table__row .q-table_1_column_4.is-hidden.q-table__cell .q-popover__reference',
                '标题': '.q-table__row .q-table_1_column_5.q-table__cell .q-popover__reference',
            },
        };
    }
// 获取敏感信息配置
    getSensitiveInfo() {
        return {
            "正则表达式": {
                "链接": [
                    {
                        "ak": "https?:\\/\\/[^\\s]*ak=[^&]*", // 匹配包含 &ak= 的链接
                        "key": "https?:\\/\\/[^\\s]*key=[^&]*", // 匹配只包含 key=
                    }
                ],
                "云密钥": [
                    {
                        "亚马逊云": "AKIA[A-Za-z0-9]{16}", // 匹配亚马逊云的密钥
                        "Google Cloud": "GOOG[\\w\\W]{10,30}", // 匹配 Google Cloud 的密钥
                        "Microsoft Azure": "AZ[A-Za-z0-9]{34,40}$", // 匹配 Microsoft Azure 的密钥
                        "IBM Cloud": "IBM[A-Za-z0-9]{10,40}", // 匹配 IBM Cloud 的密钥
                        "Oracle Cloud": "OCID[A-Za-z0-9]{10,40}", // 匹配 Oracle Cloud 的密钥
                        "阿里云": "LTAI[A-Za-z0-9]{12,20}", // 匹配阿里云的密钥
                        "腾讯云": "AKID[A-Za-z0-9]{13,20}", // 匹配腾讯云的密钥
                        "华为云": "AK[\\w\\W]{10,62}", // 匹配华为云的密钥
                        "百度云": "AK[A-Za-z0-9]{10,40}", // 匹配百度云的密钥
                        "京东云": "JDC_[A-Z0-9]{28,32}", // 匹配京东云的密钥
                        "字节跳动火山引擎": "AKLT[a-zA-Z0-9-_]{0,252}", // 匹配字节跳动火山引擎的密钥
                        "UCloud": "UC[A-Za-z0-9]{10,40}", // 匹配 UCloud 的密钥
                        "青云": "QY[A-Za-z0-9]{10,40}", // 匹配青云的密钥
                        "金山云": "AKLT[a-zA-Z0-9-_]{16,28}", // 匹配金山云的密钥
                        "联通云": "LTC[A-Za-z0-9]{10,60}", // 匹配联通云的密钥
                        "移动云": "YD[A-Za-z0-9]{10,60}", // 匹配移动云的密钥
                        "电信云": "CTC[A-Za-z0-9]{10,60}", // 匹配电信云的密钥
                        "一云通": "YYT[A-Za-z0-9]{10,60}", // 匹配一云通的密钥
                        "用友云": "YY[A-Za-z0-9]{10,40}", // 匹配用友云的密钥
                        "南大通用云": "CI[A-Za-z0-9]{10,40}", // 匹配南大通用云的密钥
                        "G-Core Labs": "gcore[A-Za-z0-9]{10,30}", // 匹配 G-Core Labs 的密钥
                    }
                ],
                "身份证": [
                    {
                        "身份证号": "\\d{17}[\\dXx]" // 匹配中国身份证号
                    }
                ],
                "学号": [
                    {
                        "学号": "\\d{10}" // 假设的学号格式
                    }
                ],
                "敏感信息": [
                    {
                        // "API密钥": "((access_key|access_token|admin_pass|admin_user|algolia_admin_key|algolia_api_key|alias_pass|alicloud_access_key|amazon_secret_access_key|amazonaws|ansible_vault_password|aos_key|api_key|api_key_secret|api_key_sid|api_secret|api.googlemaps AIza|apidocs|apikey|apiSecret|app_debug|app_id|app_key|app_log_level|app_secret|appkey|appkeysecret|application_key|appsecret|appspot|auth_token|authorizationToken|authsecret|aws_access|aws_access_key_id|aws_bucket|aws_key|aws_secret|aws_secret_key|aws_token|AWSSecretKey|b2_app_key|bashrc password|bintray_apikey|bintray_gpg_password|bintray_key|bintraykey|bluemix_api_key|bluemix_pass|browserstack_access_key|bucket_password|bucketeer_aws_access_key_id|bucketeer_aws_secret_access_key|built_branch_deploy_key|bx_password|cache_driver|cache_s3_secret_key|cattle_access_key|cattle_secret_key|certificate_password|ci_deploy_password|client_secret|client_zpk_secret_key|clojars_password|cloud_api_key|cloud_watch_aws_access_key|cloudant_password|cloudflare_api_key|cloudflare_auth_key|cloudinary_api_secret|cloudinary_name|codecov_token|config|conn.login|connectionstring|consumer_key|consumer_secret|credentials|cypress_record_key|database_password|database_schema_test|datadog_api_key|datadog_app_key|db_password|db_server|db_username|dbpasswd|dbpassword|dbuser|deploy_password|digitalocean_ssh_key_body|digitalocean_ssh_key_ids|docker_hub_password|docker_key|docker_pass|docker_passwd|docker_password|dockerhub_password|dockerhubpassword|dot-files|dotfiles|droplet_travis_password|dynamoaccesskeyid|dynamosecretaccesskey|elastica_host|elastica_port|elasticsearch_password|encryption_key|encryption_password|env.heroku_api_key|env.sonatype_password|eureka.awssecretkey)[a-z0-9_.\\-,]{0,25}(=|>|:=|\\|\\|:|<=|=>|:).{0,5}['\"]([0-9a-zA-Z\\-_=]{8,64})['\"]"
                    }
                ]
            },
            "关键词": {
                "暗链": ["开云"],
                "API密钥": [
                    "access_key", "access_token", "admin_pass", "admin_user", "algolia_admin_key",
                    "algolia_api_key", "alias_pass", "alicloud_access_key", "amazon_secret_access_key",
                    "amazonaws", "ansible_vault_password", "aos_key", "api_key", "api_key_secret",
                    "api_key_sid", "api_secret", "api.googlemaps AIza", "apidocs", "apikey", 
                    "apiSecret", "app_debug", "app_id", "app_key", "app_log_level", "app_secret", 
                    "appkey", "appkeysecret", "application_key", "appsecret", "appspot", 
                    "auth_token", "authorizationToken", "authsecret", "aws_access", 
                    "aws_access_key_id", "aws_bucket", "aws_key", "aws_secret", 
                    "aws_secret_key", "aws_token", "AWSSecretKey", "b2_app_key", 
                    "bashrc password", "bintray_apikey", "bintray_gpg_password", 
                    "bintray_key", "bintraykey", "bluemix_api_key", "bluemix_pass", 
                    "browserstack_access_key", "bucket_password", "bucketeer_aws_access_key_id", 
                    "bucketeer_aws_secret_access_key", "built_branch_deploy_key", "bx_password", 
                    "cache_driver", "cache_s3_secret_key", "cattle_access_key", "cattle_secret_key", 
                    "certificate_password", "ci_deploy_password", "client_secret", 
                    "client_zpk_secret_key", "clojars_password", "cloud_api_key", 
                    "cloud_watch_aws_access_key", "cloudant_password", "cloudflare_api_key", 
                    "cloudflare_auth_key", "cloudinary_api_secret", "cloudinary_name", 
                    "codecov_token", "config", "conn.login", "connectionstring", 
                    "consumer_key", "consumer_secret", "credentials", "cypress_record_key", 
                    "database_password", "database_schema_test", "datadog_api_key", 
                    "datadog_app_key", "db_password", "db_server", "db_username", 
                    "dbpasswd", "dbpassword", "dbuser", "deploy_password", 
                    "digitalocean_ssh_key_body", "digitalocean_ssh_key_ids", "docker_hub_password", 
                    "docker_key", "docker_pass", "docker_passwd", "docker_password", 
                    "dockerhub_password", "dockerhubpassword", "dot-files", "dotfiles", 
                    "droplet_travis_password", "dynamoaccesskeyid", "dynamosecretaccesskey", 
                    "elastica_host", "elastica_port", "elasticsearch_password", 
                    "encryption_key", "encryption_password", "env.heroku_api_key", 
                    "env.sonatype_password", "eureka.awssecretkey"
                ],
            }
        };
    }

    processSourceCode(sourceHTML) {
        const parser = new DOMParser(); // 创建 DOM 解析器
        const doc = parser.parseFromString(sourceHTML, 'text/html'); // 解析 HTML到doc
        const domain = this.domainElement.textContent; // 获取域名
        const linkSelectors = this.selectorMap[domain] || {}; // 获取对应选择器
        
        // 检查是否有选择器可用
        if (Object.keys(linkSelectors).length > 0) {
            this.populateTable(doc, linkSelectors); // 填充数据到表格
        } else {
            console.log('helloworld'); // 输出 helloworld
            this.extractSensitiveInfo(doc); // 提取敏感信息
        }
    }

    populateTable(doc, linkSelectors) {
        this.linkTableBody.innerHTML = ''; // 清空表格内容
        this.headers = []; // 清空表头
    
        const Data = []; // 数组形式存储数据
    
        // 遍历选择器映射
        for (const linkName in linkSelectors) {
            const selector = linkSelectors[linkName]; // 获取选择器,也就是键值
            const links = doc.querySelectorAll(selector); // 获取匹配的元素，也就是值
            console.log(selector);
    
            // 如果找到了匹配的链接
            if (links.length > 0) {
                this.headers.push(linkName); // 添加表头
                links.forEach((link, index) => {
                    const linkText = link.textContent.trim(); // 获取链接文本值,是所有的值
                    console.log(index,linkText);
                    if (linkText) {
                        Data[index] = Data[index] || {}; // 初始化一个空对象,就是嵌套数组
                        Data[index][linkName] = linkText; // 嵌套数组的内层存储数据
                    }
                });
            }
        }
        console.log('提取到的行数据:', Data); // 输出 Data 内容
    
        // 如果没有找到任何数据
        if (this.headers.length === 0) {
            this.feedbackElement.textContent = '没有找到匹配的链接。';
            return; // 仍然不生成表格
        }
    
        this.createTable(Data); // 创建表格
    }

    createTable(Data) {
        const headerRow = this.linkTableBody.insertRow(); // 创建表头行
        this.addHeaderCells(headerRow); // 添加表头单元格
    
        // 遍历行数据
        Data.forEach((data, rowIndex) => {
            const dataRow = this.linkTableBody.insertRow(); // 创建数据行
            const serialCell = dataRow.insertCell(); // 创建序号单元格
            serialCell.textContent = rowIndex + 1; // 显示序号
    
            // 添加点击事件以复制整行数据
            serialCell.style.cursor = 'pointer'; // 指示可点击
            serialCell.addEventListener('click', () => {
                this.copyRowData(rowIndex); // 复制整行数据
            });
    
            this.headers.forEach(linkName => {
                const cell = dataRow.insertCell(); // 创建数据单元格
                cell.textContent = data[linkName] || ''; // 填充数据
                cell.style.cursor = 'pointer'; // 指示可点击
    
                // 添加点击事件以复制单元格内容
                cell.addEventListener('click', () => {
                    this.copyToClipboard([cell.textContent.trim()], linkName); // 复制单元格内容
                });
            });
        });
    }

    addHeaderCells(headerRow) {
        const serialHeader = document.createElement('th'); // 创建序号表头
        serialHeader.textContent = '序号';
        headerRow.appendChild(serialHeader);

        this.headers.forEach(linkName => {
            const th = document.createElement('th'); // 创建数据表头
            th.textContent = linkName;
            th.style.cursor = 'pointer'; // 指示可点击
            th.addEventListener('click', () => this.copyColumnData(linkName)); // 点击表头复制整列数据
            headerRow.appendChild(th);
        });
    }

    copyRowData(rowIndex) {
        const rowData = [];
        const cells = this.linkTableBody.rows[rowIndex + 1].cells; // 获取指定行的单元格
    
        // 遍历单元格，收集数据
        for (let i = 1; i < cells.length; i++) { // 从 1 开始，跳过序号单元格
            rowData.push(cells[i].textContent.trim()); // 存储单元格内容
        }
    
        this.copyToClipboard(rowData, '整行数据'); // 复制整行数据
    }
    copyColumnData(linkName) {
        const columnData = [];
        const rows = this.linkTableBody.rows; // 获取表格行
    
        // 遍历行
        for (let i = 1; i < rows.length; i++) {
            const cell = rows[i].cells[this.headers.indexOf(linkName) + 1]; // 获取指定列的单元格
            if (cell) {
                columnData.push(cell.textContent.trim()); // 存储单元格内容
            }
        }
    
        this.copyToClipboard(columnData, linkName); // 复制列数据
    }

    copyToClipboard(columnData, columnName) {
        if (columnData.length === 0) {
            this.feedbackElement.textContent = '没有可复制的数据。';
            return;
        }
    
        const textToCopy = columnData.join('\n'); // 将数据拼接成字符串
        navigator.clipboard.writeText(textToCopy) // 复制到剪贴板
            .then(() => {
                // 显示复制的具体内容
                this.feedbackElement.textContent = `已复制 "${textToCopy}"`;
            })
            .catch(err => {
                this.feedbackElement.textContent = '复制失败！请检查权限设置。'; // 处理复制失败的情况
            });
    }
    //传入要被复制得元素id和flag值，flag值为true时为源码，false时为其他内容,sourceCode为源码内容,
    copyelementId(elementId, isSourceCode = false, SourceCode = false) {
        const element = document.getElementById(elementId);
        let text; // 在函数顶部声明 text 变量
    
        if (isSourceCode) {
            text = SourceCode; // 获取源码
            console.log(elementId, isSourceCode, SourceCode);
        } else {
            text = element ? element.textContent : null; // 获取文本内容
        }
    
        console.log(text); // 注意这里是 text，而不是 this.text
    
        if (text) {
            navigator.clipboard.writeText(text) // 复制到剪贴板
                .then(() => {
                    const sizeInBytes = new TextEncoder().encode(text).length; // 计算字节大小
                    
                    // 直接在这里进行格式化
                    let sizeFormatted;
                    if (sizeInBytes < 1024) {
                        sizeFormatted = sizeInBytes + ' 字节'; // 小于 1 KB
                    } else if (sizeInBytes < 1024 * 1024) {
                        sizeFormatted = (sizeInBytes / 1024).toFixed(2) + ' KB'; // 小于 1 MB
                    } else {
                        sizeFormatted = (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB'; // MB
                    }
    
                    if (!isSourceCode) {
                        console.log(`已复制！${isSourceCode}`); // 打印复制的内容
                        this.feedbackElement.textContent = `已复制！${text}`; // 显示成功信息
                    } else {
                        this.feedbackElement.textContent = `源码已复制！大小: ${sizeFormatted}`; // 显示源码大小
                        console.log(`已复制！${isSourceCode}`); // 打印复制的内容
                    }
                })
                .catch(err => {
                    this.feedbackElement.textContent = '复制失败！请检查权限设置。'; // 处理复制失败的情况
                });
        } else {
            this.feedbackElement.textContent = '没有可复制的内容。'; // 没有内容可复制
        }
    }

// 提取敏感信息
extractSensitiveInfo(doc) {
    const sensitiveInfo = this.getSensitiveInfo();
    const results = [];

    // 提取正则表达式
    const regexList = [];

    // 匹配链接中的 ak 和 key
    sensitiveInfo.正则表达式.链接.forEach(link => {
        regexList.push({ name: '链接 ak', regex: new RegExp(link.ak, 'g') });
        regexList.push({ name: '链接 key', regex: new RegExp(link.key, 'g') });
    });

    // 匹配云密钥
    const cloudKeys = sensitiveInfo.正则表达式.云密钥[0];
    for (const key in cloudKeys) {
        regexList.push({ name: key, regex: new RegExp(cloudKeys[key], 'g') });
    }

    // 匹配身份证号
    regexList.push({ name: '身份证号', regex: new RegExp(sensitiveInfo.正则表达式.身份证[0].身份证号, 'g') });

    // 匹配学号
    regexList.push({ name: '学号', regex: new RegExp(sensitiveInfo.正则表达式.学号[0].学号, 'g') });

    // 获取网页内容
    const bodyText = doc.body.innerText;

    // 检查是否有匹配并记录结果
    regexList.forEach(item => {
        const matches = bodyText.match(item.regex);
        if (matches) {
            results.push({ key: item.name, values: matches });
        }
    });

    // 更新 popup.html 中的表格
    this.updateResultsTable(results);
}

// 更新表格的函数
updateResultsTable(results) {
    const tableBody = document.querySelector('#linkTable tbody');
    tableBody.innerHTML = ''; // 清空之前的内容

    if (results.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = '未发现敏感信息。';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    results.forEach(result => {
        result.values.forEach(value => {
            const row = document.createElement('tr');
            const keyCell = document.createElement('td');
            const valueCell = document.createElement('td');
            keyCell.textContent = result.key; // 写入匹配到的键名
            valueCell.textContent = value; // 写入匹配到的值
            row.appendChild(keyCell);
            row.appendChild(valueCell);
            tableBody.appendChild(row);
        });
    });
}
    handleError(error) {
        this.feedbackElement.textContent = '请求失败: ' + error.message; // 显示错误信息
    }
}
