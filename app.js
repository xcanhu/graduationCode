// app.js
App({
  onLaunch: function() {
    // 初始化全局数据
    this.globalData = {
      userInfo: null,
      apiErrors: [],    // 跟踪API错误
      preheatFailed: false, // 预热失败状态
      apiReady: false   // API就绪状态
    }
    
    // 初始化云环境
    this.initCloud();
    
    // 延迟预热云函数，避免启动时的并发请求
    setTimeout(() => {
      this.preheatCloudFunction();
    }, 2000);
  },
  
  // 初始化云环境
  initCloud: function() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      wx.showToast({
        title: '请更新微信版本',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.cloud.init({
        // 不再硬编码环境ID，使用默认环境或从配置中读取
        env: wx.cloud.DYNAMIC_CURRENT_ENV,
        traceUser: true,
      });
      console.log('云环境初始化成功');
    } catch (error) {
      console.error('云环境初始化失败:', error);
      this.recordApiError('cloud_init', error);
      wx.showToast({
        title: '系统初始化失败',
        icon: 'none'
      });
    }
  },
  
  // 预热云函数
  preheatCloudFunction: function() {
    console.log('正在预热云函数...');
    
    // 设置一个超时计时器，防止预热过程阻塞
    const timeout = setTimeout(() => {
      console.log('预热云函数超时，但不影响程序运行');
      this.globalData.preheatFailed = true;
    }, 4000);
    
    // 使用安全的测试查询，避免特殊字符
    const testQuery = '你好，我需要查询车票信息';
    
    // 预热deepseekChat云函数
    wx.cloud.callFunction({
      name: 'deepseekChat',
      data: {
        query: testQuery,
        historyMessages: []
      }
    }).then(res => {
      clearTimeout(timeout);
      
      if (res && res.result) {
        console.log('预热deepseekChat云函数成功');
        this.globalData.apiReady = true;
        
        // 检查是否有API错误
        if (res.result.error) {
          console.warn('API返回错误但仍可使用:', res.result.error);
          this.recordApiError('preheat_api_error', res.result.error);
        }
      } else {
        console.warn('预热返回无效结果');
        this.globalData.preheatFailed = true;
        this.recordApiError('preheat_invalid', 'API返回无效');
      }
    }).catch(err => {
      clearTimeout(timeout);
      console.error('预热deepseekChat云函数失败:', err);
      this.recordApiError('preheat_fail', err);
      
      // 标记预热失败，以便后续处理
      this.globalData.preheatFailed = true;
      
      // 分析错误类型并提供更详细的日志
      if (err.errMsg) {
        if (err.errMsg.includes('EPROTO') || err.errMsg.includes('SSL')) {
          console.error('发现SSL/TLS连接问题，可能需要检查证书或API配置');
        } else if (err.errMsg.includes('timeout')) {
          console.error('云函数调用超时，请检查网络或云函数执行时间');
        } else if (err.errMsg.includes('not found')) {
          console.error('云函数未找到，请检查云函数是否已正确部署');
        }
      }
    });
  },
  
  // 记录API错误
  recordApiError: function(type, error) {
    try {
      const errorInfo = {
        type,
        time: new Date().toISOString(),
        message: error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))
      };
      
      this.globalData.apiErrors.push(errorInfo);
      
      // 只保留最近的10条错误记录
      if (this.globalData.apiErrors.length > 10) {
        this.globalData.apiErrors.shift();
      }
      
      // 对严重错误进行上报
      if (['cloud_init', 'preheat_fail'].includes(type)) {
        // 可以在这里添加错误上报逻辑
        console.error('严重错误，需要上报:', errorInfo);
      }
    } catch (e) {
      // 防止错误处理自身出错
      console.error('记录错误信息时发生异常:', e);
    }
  },
  
  // 获取云函数预热状态
  getPreheatStatus: function() {
    return !this.globalData.preheatFailed;
  },
  
  // 获取API就绪状态
  getApiReadyStatus: function() {
    return this.globalData.apiReady;
  },
  
  // 获取API错误历史
  getApiErrorHistory: function() {
    return this.globalData.apiErrors;
  }
})
