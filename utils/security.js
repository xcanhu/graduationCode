// 安全模块 - 用于输入验证、数据加密和安全检查

// 安全处理输入数据
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // 移除可能导致问题的特殊字符
  return input.trim()
    .replace(/[\[\]》《【】<>]/g, '')
    .substring(0, 500); // 限制长度
}

// 安全处理敏感数据，如身份证号码
function maskSensitiveData(data, type = 'idCard') {
  if (!data || typeof data !== 'string') {
    return '';
  }
  
  switch(type) {
    case 'idCard':
      // 身份证号码 - 只显示前4位和后4位
      if (data.length >= 8) {
        return data.substring(0, 4) + '********' + data.substring(data.length - 4);
      }
      return '********';
      
    case 'phone':
      // 手机号码 - 只显示前3位和后4位
      if (data.length >= 7) {
        return data.substring(0, 3) + '****' + data.substring(data.length - 4);
      }
      return '****';
      
    case 'name':
      // 姓名 - 只显示姓氏
      if (data.length > 1) {
        return data.substring(0, 1) + '*'.repeat(data.length - 1);
      }
      return '*';
      
    case 'email':
      // 邮箱 - 显示@前的首字符和@后的域名
      const parts = data.split('@');
      if (parts.length === 2 && parts[0].length > 0) {
        return parts[0].substring(0, 1) + '***@' + parts[1];
      }
      return '***@***.com';
      
    default:
      return '******';
  }
}

// 验证输入格式
function validateInput(input, type) {
  if (!input) return false;
  
  const validators = {
    // 手机号码格式验证
    phone: (val) => /^1[3-9]\d{9}$/.test(val),
    
    // 身份证号码格式验证 (简单版)
    idCard: (val) => /^\d{17}[\dX]$/.test(val),
    
    // 邮箱格式验证
    email: (val) => /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(val),
    
    // 日期格式验证 (YYYY-MM-DD)
    date: (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
    
    // 中文姓名验证
    chineseName: (val) => /^[\u4e00-\u9fa5]{2,6}$/.test(val),
    
    // 城市名称验证
    cityName: (val) => /^[\u4e00-\u9fa5]{2,10}$/.test(val),
    
    // 价格验证
    price: (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0
  };
  
  if (validators[type]) {
    return validators[type](input);
  }
  
  return true; // 没有对应的验证器则默认通过
}

// 安全检查 - 检测请求中的异常模式
function detectAbnormalPatterns(requestData) {
  const warnings = [];
  
  // 频率检查 - 全局请求计数器
  if (typeof global._requestCounter === 'undefined') {
    global._requestCounter = 0;
    global._requestStartTime = Date.now();
  }
  
  global._requestCounter++;
  
  // 检查1秒内的请求数是否超过阈值
  const now = Date.now();
  if (now - global._requestStartTime >= 1000) {
    if (global._requestCounter > 50) { // 每秒超过50次请求
      warnings.push({
        type: 'HIGH_FREQUENCY',
        message: '检测到高频请求'
      });
    }
    
    // 重置计数器
    global._requestCounter = 0;
    global._requestStartTime = now;
  }
  
  // 检查大量重复内容
  if (requestData && typeof requestData === 'object') {
    const requestString = JSON.stringify(requestData);
    
    if (typeof global._lastRequests === 'undefined') {
      global._lastRequests = [];
    }
    
    // 检查是否与最近5个请求完全相同
    const isDuplicate = global._lastRequests.some(req => req === requestString);
    if (isDuplicate) {
      warnings.push({
        type: 'DUPLICATE_REQUEST',
        message: '检测到重复请求'
      });
    }
    
    // 记录当前请求
    global._lastRequests.push(requestString);
    if (global._lastRequests.length > 5) {
      global._lastRequests.shift(); // 只保留最近5个
    }
  }
  
  return warnings;
}

// 日志安全记录函数
function secureLog(message, data = {}, level = 'info') {
  // 创建一个不包含敏感数据的安全版本对象
  const safeData = { ...data };
  
  // 掩盖敏感字段
  const sensitiveFields = ['idCard', 'phone', 'password', 'token', 'apiKey'];
  
  sensitiveFields.forEach(field => {
    if (safeData[field]) {
      safeData[field] = '******';
    }
  });
  
  // 记录安全的日志
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`, safeData);
  
  // 如果是错误级别，可以考虑将日志保存到数据库
  if (level === 'error' && wx && wx.cloud) {
    try {
      wx.cloud.callFunction({
        name: 'logError',
        data: {
          message,
          level,
          timestamp,
          data: safeData
        }
      }).catch(err => {
        console.error('记录错误日志失败:', err);
      });
    } catch (e) {
      console.error('发送错误日志失败:', e);
    }
  }
}

module.exports = {
  sanitizeInput,
  maskSensitiveData,
  validateInput,
  detectAbnormalPatterns,
  secureLog
}; 