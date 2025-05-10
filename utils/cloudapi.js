// 云函数API调用

// 安全处理输入数据
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // 移除可能导致问题的特殊字符
  return input.trim()
    .replace(/[\[\]》《【】]/g, '')
    .substring(0, 500); // 限制长度
}

// 请求状态跟踪
const apiRequestStatus = {
  deepseekRequests: 0,
  totalRequests: 0,
  failedRequests: 0,
  lastError: null
};

// 查询车票
const searchTickets = (departure, destination, date) => {
  // 输入验证
  if (!departure || !destination || !date) {
    return Promise.reject(new Error('缺少必要参数'));
  }
  
  // 安全处理输入
  const safeDeparture = sanitizeInput(departure);
  const safeDestination = sanitizeInput(destination);
  
  // 验证日期格式
  let safeDate;
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('日期格式无效');
    }
    safeDate = formatDate(dateObj);
  } catch (e) {
    return Promise.reject(new Error('日期格式无效'));
  }
  
  return new Promise((resolve, reject) => {
    apiRequestStatus.totalRequests++;
    
    wx.cloud.callFunction({
      name: 'searchTickets',
      data: {
        departure: safeDeparture,
        destination: safeDestination,
        date: safeDate
      }
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve(res.result.data)
      } else {
        apiRequestStatus.failedRequests++;
        apiRequestStatus.lastError = res.result.errMsg || '查询失败';
        reject(new Error(res.result.errMsg || '查询失败'))
      }
    })
    .catch(err => {
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = err.message || '调用云函数失败';
      console.error('调用查询车票云函数失败', err)
      reject(err)
    })
  })
}

// 获取天气信息
const getWeather = (city) => {
  // 输入验证与净化
  if (!city || typeof city !== 'string') {
    console.warn('城市参数无效，使用默认值');
    city = '商城';
  }
  
  const safeCity = sanitizeInput(city);
  
  return new Promise((resolve, reject) => {
    apiRequestStatus.totalRequests++;
    
    wx.cloud.callFunction({
      name: 'getWeather',
      data: {
        city: safeCity
      }
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve(res.result.data)
      } else {
        console.warn('获取天气信息失败，使用默认值');
        // 返回默认天气数据
        resolve({
          temperature: '暂无数据',
          weather: '暂无数据',
          icon: '',
          error: res.result?.errMsg
        })
      }
    })
    .catch(err => {
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = err.message || '调用天气云函数失败';
      console.error('调用获取天气云函数失败', err)
      // 返回默认天气数据
      resolve({
        temperature: '暂无数据',
        weather: '暂无数据',
        icon: '',
        error: err.message
      })
    })
  })
}

// 使用DeepSeek聊天AI处理查询
function deepseekChat(query, historyMessages = []) {
  return new Promise((resolve, reject) => {
    // 参数验证
    if (!query || typeof query !== 'string') {
      wx.hideLoading();
      return reject(new Error('无效的查询参数'));
    }
    
    // 净化输入 - 移除可能导致API错误的特殊字符
    const safeQuery = sanitizeInput(query);
    
    // 确保输入不为空
    if (!safeQuery) {
      wx.hideLoading();
      return reject(new Error('请输入有效的查询内容'));
    }
    
    wx.showLoading({
      title: '正在思考...',
      mask: true
    });
    
    // 增加请求状态跟踪
    apiRequestStatus.totalRequests++;
    apiRequestStatus.deepseekRequests++;
    
    // 添加超时处理
    const timeout = setTimeout(() => {
      wx.hideLoading();
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = '请求超时';
      reject(new Error('请求超时，请稍后再试'));
    }, 30000); // 30秒超时
    
    // 确保历史消息格式正确
    const safeHistoryMessages = Array.isArray(historyMessages) 
      ? historyMessages.map(msg => ({
          role: ['user', 'assistant', 'system'].includes(msg.role) ? msg.role : 'user',
          content: typeof msg.content === 'string' ? sanitizeInput(msg.content) : ''
        })).filter(msg => msg.content).slice(-10) // 只保留最近10条
      : [];
    
    // 调试日志
    console.log('发送到API的查询:', safeQuery);
    console.log('发送到API的历史消息数:', safeHistoryMessages.length);
    
    wx.cloud.callFunction({
      name: 'deepseekChat',
      data: { 
        query: safeQuery,
        historyMessages: safeHistoryMessages
      }
    })
    .then(res => {
      clearTimeout(timeout); // 清除超时计时器
      wx.hideLoading();
      
      console.log('API原始响应:', res);
      
      if (res && res.result) {
        // 即使有错误也返回结果，让调用方处理
        if (res.result.error) {
          console.warn('API返回错误:', res.result.error);
          apiRequestStatus.failedRequests++;
          apiRequestStatus.lastError = res.result.error;
          
          // 但仍然返回message以显示给用户
          resolve({
            success: false,
            message: res.result.message || '处理请求时遇到问题，请重试',
            error: res.result.error
          });
        } else if (res.result.success || res.result.message) {
          resolve(res.result);
        } else {
          apiRequestStatus.failedRequests++;
          apiRequestStatus.lastError = '无效的API响应格式';
          reject(new Error('无效的API响应格式'));
        }
      } else {
        apiRequestStatus.failedRequests++;
        apiRequestStatus.lastError = '无效的响应内容';
        reject(new Error('无效的响应内容'));
      }
    })
    .catch(err => {
      clearTimeout(timeout); // 清除超时计时器
      wx.hideLoading();
      console.error('调用DeepSeek AI云函数失败:', err);
      
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = err.message || '调用AI云函数失败';
      
      // 提供更具体的错误信息
      if (err.errMsg && err.errMsg.includes('EPROTO')) {
        reject(new Error('网络连接安全问题，请检查API配置'));
      } else if (err.errMsg && err.errMsg.includes('timeout')) {
        reject(new Error('请求超时，请检查网络连接'));
      } else {
        reject(err);
      }
    });
  });
}

// 创建订单
const createOrder = (orderData) => {
  // 参数验证
  if (!orderData || typeof orderData !== 'object') {
    return Promise.reject(new Error('订单数据无效'));
  }
  
  // 安全处理订单数据
  const safeOrder = {
    ticketId: orderData.ticketId,
    passengerName: sanitizeInput(orderData.passengerName || ''),
    passengerPhone: sanitizeInput(orderData.passengerPhone || ''),
    passengerIdCard: sanitizeInput(orderData.passengerIdCard || ''),
    from: sanitizeInput(orderData.from || ''),
    to: sanitizeInput(orderData.to || ''),
    departureTime: orderData.departureTime,
    status: '待付款', // 固定初始状态
    price: Number(orderData.price) || 0
  };
  
  return new Promise((resolve, reject) => {
    apiRequestStatus.totalRequests++;
    
    // 基本验证
    if (!safeOrder.ticketId || !safeOrder.passengerName || !safeOrder.from || !safeOrder.to) {
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = '订单缺少必要信息';
      return reject(new Error('订单缺少必要信息'));
    }
    
    wx.cloud.callFunction({
      name: 'createOrder',
      data: safeOrder
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve(res.result.data)
      } else {
        apiRequestStatus.failedRequests++;
        apiRequestStatus.lastError = res.result?.message || '创建订单失败';
        reject(new Error(res.result?.message || '创建订单失败'))
      }
    })
    .catch(err => {
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = err.message || '调用创建订单云函数失败';
      console.error('调用创建订单云函数失败', err)
      reject(err)
    })
  })
}

// 获取订单列表
const getOrders = (status = '全部') => {
  const safeStatus = sanitizeInput(status);
  
  return new Promise((resolve, reject) => {
    apiRequestStatus.totalRequests++;
    
    wx.cloud.callFunction({
      name: 'getOrders',
      data: { status: safeStatus }
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve(res.result.data)
      } else {
        apiRequestStatus.failedRequests++;
        apiRequestStatus.lastError = res.result?.message || '获取订单失败';
        reject(new Error(res.result?.message || '获取订单失败'))
      }
    })
    .catch(err => {
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = err.message || '调用获取订单云函数失败';
      console.error('调用获取订单云函数失败', err)
      reject(err)
    })
  })
}

// 更新订单状态
const updateOrderStatus = (orderId, status) => {
  return new Promise((resolve, reject) => {
    // 参数验证
    if (!orderId) {
      return reject(new Error('订单ID不能为空'));
    }
    
    if (!status || typeof status !== 'string') {
      return reject(new Error('状态参数不能为空'));
    }
    
    // 限制状态为有效值
    const validStatuses = ['待付款', '已付款', '已取消', '已完成', '已退款'];
    if (!validStatuses.includes(status)) {
      return reject(new Error('无效的订单状态'));
    }
    
    apiRequestStatus.totalRequests++;
    
    wx.cloud.callFunction({
      name: 'updateOrderStatus',
      data: { 
        orderId: sanitizeInput(orderId), 
        status: sanitizeInput(status)
      }
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve();
      } else {
        apiRequestStatus.failedRequests++;
        apiRequestStatus.lastError = res.result?.message || '更新订单状态失败';
        reject(new Error(res.result?.message || '更新订单状态失败'));
      }
    })
    .catch(err => {
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = err.message || '调用更新订单状态云函数失败';
      console.error('调用更新订单状态云函数失败', err);
      reject(err);
    });
  });
}

// 获取用户信息
const getUserInfo = () => {
  return new Promise((resolve, reject) => {
    apiRequestStatus.totalRequests++;
    
    wx.cloud.callFunction({
      name: 'getUserInfo'
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve(res.result.data)
      } else {
        apiRequestStatus.failedRequests++;
        apiRequestStatus.lastError = res.result?.message || '获取用户信息失败';
        reject(new Error(res.result?.message || '获取用户信息失败'))
      }
    })
    .catch(err => {
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = err.message || '调用获取用户信息云函数失败';
      console.error('调用获取用户信息云函数失败', err)
      reject(err)
    })
  })
}

// 更新用户信息
const updateUserInfo = (userInfo) => {
  // 参数验证
  if (!userInfo || typeof userInfo !== 'object') {
    return Promise.reject(new Error('用户信息无效'));
  }
  
  // 安全处理用户数据
  const safeUserInfo = {
    name: sanitizeInput(userInfo.name || ''),
    phone: sanitizeInput(userInfo.phone || ''),
    idCard: sanitizeInput(userInfo.idCard || ''),
    email: sanitizeInput(userInfo.email || '')
  };
  
  return new Promise((resolve, reject) => {
    apiRequestStatus.totalRequests++;
    
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: safeUserInfo
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve(res.result.data)
      } else {
        apiRequestStatus.failedRequests++;
        apiRequestStatus.lastError = res.result?.message || '更新用户信息失败';
        reject(new Error(res.result?.message || '更新用户信息失败'))
      }
    })
    .catch(err => {
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = err.message || '调用更新用户信息云函数失败';
      console.error('调用更新用户信息云函数失败', err)
      reject(err)
    })
  })
}

// 初始化数据库
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    apiRequestStatus.totalRequests++;
    
    wx.cloud.callFunction({
      name: 'initDatabase'
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve()
      } else {
        apiRequestStatus.failedRequests++;
        apiRequestStatus.lastError = res.result?.message || '初始化数据库失败';
        reject(new Error(res.result?.message || '初始化数据库失败'))
      }
    })
    .catch(err => {
      apiRequestStatus.failedRequests++;
      apiRequestStatus.lastError = err.message || '调用初始化数据库云函数失败';
      console.error('调用初始化数据库云函数失败', err)
      reject(err)
    })
  })
}

// 获取API请求状态统计
const getApiRequestStats = () => {
  return { ...apiRequestStatus };
}

// 格式化日期
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化价格
const formatPrice = (price) => {
  if (typeof price !== 'number') {
    try {
      price = parseFloat(price);
    } catch (e) {
      return '0.00';
    }
  }
  
  if (isNaN(price)) {
    return '0.00';
  }
  
  return price.toFixed(2);
}

module.exports = {
  searchTickets,
  getWeather,
  deepseekChat,
  createOrder,
  getOrders,
  updateOrderStatus,
  getUserInfo,
  updateUserInfo,
  initDatabase,
  formatDate,
  formatPrice,
  getApiRequestStats
} 