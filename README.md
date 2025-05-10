# 巴士售票微信小程序

基于微信小程序平台开发的巴士售票应用，集成DeepSeek大语言模型作为智能助手，提供车票查询、订单管理等功能。

## 项目特点

- 完整的车票查询与订票流程
- 集成DeepSeek大语言模型的智能助手
- 用户信息管理与订单跟踪
- 多城市路线信息展示
- 安全的数据处理与隐私保护

## 安全优化

项目已完成以下安全优化：

1. **API安全性**
   - 修复了SSL证书验证问题
   - 移除了不安全的HTTPS配置
   - 增强了API请求错误处理

2. **输入验证与净化**
   - 添加了全面的输入验证与净化机制
   - 防止特殊字符导致的安全问题
   - 限制输入长度以防止DOS攻击

3. **数据保护**
   - 敏感数据（如身份证号）在传输和存储时进行掩码处理
   - 云函数错误日志系统自动脱敏敏感信息
   - 用户隐私数据采用最小权限原则处理

4. **异常检测**
   - 添加了请求频率监控和异常行为检测
   - 云函数增加了错误日志收集功能
   - 前端UI添加了错误状态恢复机制

5. **代码优化**
   - 消除了硬编码的环境ID和API密钥
   - 更新了依赖库至最新安全版本
   - 增强了代码可维护性

## 开发环境

- 微信开发者工具 v1.06.2307170
- Node.js v16.x+
- 微信云开发

## 安装与部署

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/bus-ticket-miniprogram.git
   cd bus-ticket-miniprogram
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **云函数部署**
   ```bash
   # 自动部署所有云函数
   node deploy-cloud.js
   ```

4. **微信开发者工具配置**
   - 打开微信开发者工具
   - 导入项目
   - 在"详情"中选择"本地设置"，勾选"使用npm模块"
   - 点击"工具"中的"构建npm"

5. **配置云环境**
   - 创建云开发环境
   - 初始化数据库集合：`tickets`, `orders`, `users`, `apiConfig`, `errorLogs`
   - 使用cloudInit云函数初始化基础数据

## API配置

需要在云开发数据库中手动添加DeepSeek API配置：

1. 在云开发控制台打开数据库
2. 打开`apiConfig`集合
3. 添加文档ID为"deepseek"的记录
4. 添加以下字段:
   ```json
   {
     "apiKey": "你的DeepSeek API密钥",
     "apiUrl": "https://api.deepseek.chat",
     "model": "deepseek-chat"
   }
   ```

## 项目结构

```
├── cloudfunctions/        # 云函数
│   ├── deepseekChat/      # DeepSeek AI聊天处理
│   ├── initAPIConfig/     # API配置初始化 
│   ├── initDatabase/      # 数据库初始化
│   ├── searchTickets/     # 车票搜索
│   ├── getWeather/        # 天气查询
│   ├── createOrder/       # 订单创建
│   └── logError/          # 错误日志记录
├── components/            # 公共组件
├── pages/                 # 页面
│   ├── home/              # 首页
│   ├── ai-assistant/      # AI助手
│   ├── ticket-list/       # 车票列表
│   ├── ticket-detail/     # 车票详情
│   ├── order/             # 订单页面
│   └── mine/              # 我的页面
├── utils/                 # 工具函数
│   ├── cloudapi.js        # 云函数API封装
│   └── security.js        # 安全处理模块
├── deploy-cloud.js        # 云函数部署脚本
├── app.js                 # 应用入口
├── app.json               # 应用配置
└── app.wxss               # 应用样式
```

## 安全注意事项

- API密钥等敏感信息必须存储在云数据库中，禁止硬编码
- 项目使用了降级机制，即使API出现问题也能提供基本功能
- 在生产环境中，请确保所有API调用都启用了SSL验证

## 开发团队

- 产品经理：李明
- 前端开发：张磊
- 后端开发：王强
- 设计师：陈华

## 许可证

MIT 