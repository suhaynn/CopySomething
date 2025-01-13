# CopySomething

一个用来提取空间测绘引擎数据的插件 By suhaynn & 当前版本请配合Fofa Shodan使用（当前版本仅支持edge和chrome浏览器）

因为总使用Shodan白嫖数据，前几天写了一个网页端的链接提取工具，但是有点麻烦，需要复制源码过去然后再提取，需要两步。昨晚心血来潮，突然想写一个浏览器插件一步就搞定。
恰巧前一段时间要写批量漏洞验证脚本，需要复现，需要数据，单独一个个导出数据太麻烦，就写了这个插件，fofa一次最多可以看50条，shadan一次最多可以看1000条，这些数据量对我复现来说已经满足了。
# 1.4.1修复备案查询功能失效问题
![image](https://github.com/user-attachments/assets/8bf5639d-6c9a-4cf3-b73e-0de9c5578453)

# 1.4新增功能鹰图，quake数据提取
支持鹰图数据提取
![9a0e1469d2128eb194539f665e51228f](https://github.com/user-attachments/assets/260aee47-71f3-47c7-943c-6062405a5479)

支持quake数据提取
![e753b8b3b48f8e6b7290915d8c0e09f6](https://github.com/user-attachments/assets/5beb2a8d-9ced-4819-9baf-ea76bd7c3094)

支持fofa数据提取
![c01284f0d6e12843c949a3c7de524d2c](https://github.com/user-attachments/assets/cc3b2897-bf2e-4485-8a50-44f8d444640a)

支持Shadan数据提取
![5c1c0703fda5c27b49a973ec627896fc](https://github.com/user-attachments/assets/dba3c07e-c0e2-44d5-a6aa-9a71af68cdf9)



# 1.3新增查询备案功能
原插件superSearchPlus因为部分平台调整 导致部分查询已经失效，现在内部自用，停止维护了。
又因为我平时每周任务需要查备案，就自己写了这个功能，很简陋且丑陋，希望师傅们帮我美化一下，我将不胜感激
![image](https://github.com/user-attachments/assets/8cf6315b-80dd-4ecc-a77d-63077a336243)

# 1.2
quake和鹰图正在开发中（也不知道怎么开发，插件思路就是js发包，使用选择器来匹配链接，没用任何技术含量哈，会的师傅希望帮帮我健全一下这个插件）
![image](https://github.com/user-attachments/assets/c9227519-159f-4aac-b6d2-009f5beccc1e)

![image](https://github.com/user-attachments/assets/1b2deaa9-a9e5-45bb-b39b-e512a19eec52)

