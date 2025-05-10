const api = require('../../utils/cloudapi');

Page({
  data: {
    messages: [],
    inputValue: '',
    scrollToMessage: '',
    isRecording: false,
    recordingText: '按住说话',
    loadingText: '正在思考...',
    isLoading: false,
    chatHistory: [],  // 保存聊天历史记录
    apiStatus: {      // API状态信息
      failures: 0,    // 失败次数
      lastError: null // 最后一次错误
    }
  },

  onLoad(options) {
    // 如果有传入的查询参数，自动填充到输入框并进行安全处理
    if (options.query) {
      const safeQuery = options.query.replace(/[\[\]》《【】]/g, '').trim();
      this.setData({
        inputValue: safeQuery
      });
    }
    
    // 初始化API配置
    this.initAPIs();
    
    // 添加欢迎消息
    this.addMessage({
      type: 'ai',
      content: '您好！我是您的智能出行助手，由DeepSeek大模型提供支持。请告诉我您的出行需求，例如：\n- 明天下午去深圳\n- 后天早上从广州到珠海的车票\n- 周末去东莞的便宜车票\n- 深圳今天天气怎么样\n- 广州到珠海的票价是多少'
    });
    
    // 如果有初始查询，立即发送
    if (options.query && options.autoSend === 'true') {
      // 延迟1秒再发送，等待欢迎消息显示
      setTimeout(() => {
        this.sendMessage();
      }, 1000);
    }
  },
  
  onShow() {
    // 获取并记录API状态
    try {
      const stats = api.getApiRequestStats();
      this.setData({
        'apiStatus.failures': stats.failedRequests,
        'apiStatus.lastError': stats.lastError
      });
    } catch (e) {
      console.error('获取API状态失败:', e);
    }
  },

  // 初始化API配置
  initAPIs() {
    // 调用初始化API配置云函数
    wx.cloud.callFunction({
      name: 'initAPIConfig'
    }).then(res => {
      console.log('API配置初始化结果:', res);
      if (!res.result || !res.result.success) {
        console.error('API配置初始化失败:', res.result);
        // 显示错误提示
        wx.showToast({
          title: 'API配置失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('调用初始化API配置失败:', err);
      
      // 不立即显示错误，而是设置状态
      this.setData({
        'apiStatus.failures': this.data.apiStatus.failures + 1,
        'apiStatus.lastError': err.message || '初始化API配置失败'
      });
    });
  },

  // 输入框内容变化
  onInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 发送消息
  sendMessage() {
    const { inputValue, messages } = this.data;
    if (!inputValue.trim()) return;
    
    // 限制输入长度
    if (inputValue.length > 500) {
      wx.showToast({
        title: '输入内容过长',
        icon: 'none'
      });
      return;
    }

    // 添加用户消息
    this.addMessage({
      type: 'user',
      content: inputValue
    });

    // 更新聊天历史
    const chatHistory = [...this.data.chatHistory];
    chatHistory.push({
      role: 'user',
      content: inputValue
    });

    this.setData({
      inputValue: '',
      isLoading: true,
      chatHistory
    });

    // 直接调用DeepSeek API处理
    this.processWithDeepSeek(inputValue, chatHistory);
  },

  // 添加消息到列表
  addMessage(message) {
    const messages = [...this.data.messages, message];
    this.setData({
      messages,
      scrollToMessage: `msg-${messages.length - 1}`
    });
    
    // 确保滚动到最新消息
    setTimeout(() => {
      this.setData({
        scrollToMessage: `msg-${messages.length - 1}`
      });
    }, 100);
  },

  // 使用DeepSeek API处理用户输入
  processWithDeepSeek(userInput, chatHistory) {
    // 显示加载状态
    wx.showLoading({
      title: this.data.loadingText,
      mask: true
    });
    
    // 限制chatHistory长度，防止超过云函数限制
    const limitedChatHistory = this.limitChatHistory(chatHistory);
    
    // 添加调试日志
    console.log('开始调用DeepSeek API, 输入:', userInput);
    console.log('历史消息长度:', limitedChatHistory.length);
    
    // 先检查应用状态
    const app = getApp();
    const isPreheatFailed = app.globalData && app.globalData.preheatFailed;
    
    if (isPreheatFailed) {
      console.warn('云函数预热失败，可能影响体验');
    }
    
    // 定义超时计时器
    let apiTimeoutTimer = setTimeout(() => {
      // 如果30秒后还没响应，提供反馈但继续等待
      this.addMessage({
        type: 'ai',
        content: '请求处理时间较长，请稍候...'
      });
    }, 30000);
    
    api.deepseekChat(userInput, limitedChatHistory)
      .then(result => {
        console.log('DeepSeek处理结果:', result);
        clearTimeout(apiTimeoutTimer);
        wx.hideLoading();
        
        if (!result) {
          throw new Error('API返回为空');
        }
        
        // 处理API返回的错误
        if (result.error) {
          console.error('API报告错误:', result.error);
          // 继续处理，显示错误消息
          this.setData({
            'apiStatus.failures': this.data.apiStatus.failures + 1,
            'apiStatus.lastError': result.error
          });
        }
        
        // 更新聊天历史，添加AI回复
        const updatedChatHistory = [...this.data.chatHistory];
        if (result.message) {
          updatedChatHistory.push({
            role: 'assistant',
            content: result.message
          });
        }
        
        this.setData({
          chatHistory: updatedChatHistory,
          isLoading: false
        });
        
        // 处理AI回复
        this.handleAIResponse(result);
      })
      .catch(error => {
        clearTimeout(apiTimeoutTimer);
        console.error('DeepSeek处理失败', error);
        
        // 显示详细错误信息到控制台
        if (error.errMsg) {
          console.error('错误详情:', error.errMsg);
        }
        
        wx.hideLoading();
        
        // 更新状态
        this.setData({
          isLoading: false,
          'apiStatus.failures': this.data.apiStatus.failures + 1,
          'apiStatus.lastError': error.message || '处理请求失败'
        });
        
        let errorMessage = '抱歉，我暂时无法处理您的请求，请稍后再试。';
        
        // 根据错误类型提供更友好的错误信息
        if (error.message) {
          if (error.message.includes('网络连接安全问题')) {
            errorMessage = '抱歉，连接到AI服务时遇到安全问题，请联系开发者检查API配置。';
          } else if (error.message.includes('超时')) {
            errorMessage = '抱歉，请求处理超时，网络可能不稳定，请稍后再试。';
          } else if (error.message.includes('无效的查询')) {
            errorMessage = '抱歉，您的问题格式可能有误，请尝试用不同的方式提问。';
          }
        }
        
        this.addMessage({
          type: 'ai',
          content: errorMessage
        });
      });
  },
  
  // 限制聊天历史记录长度
  limitChatHistory(history) {
    if (!history || history.length === 0) {
      return [];
    }
    
    // 只保留最近的8条记录，减少传输量
    if (history.length > 8) {
      return history.slice(history.length - 8);
    }
    
    return history;
  },
  
  // 处理AI回复
  handleAIResponse(result) {
    // 确保result不为空
    if (!result) {
      this.addMessage({
        type: 'ai',
        content: '抱歉，我无法处理您的请求，请稍后再试'
      });
      return;
    }
    
    // 如果API返回了错误，但仍有消息
    if (!result.success && result.error) {
      // 为用户显示友好的错误消息
      this.addMessage({
        type: 'ai',
        content: result.message || '抱歉，处理您的请求时遇到问题，请稍后再试'
      });
      return;
    }
    
    // 基本消息
    const aiMessage = {
      type: 'ai',
      content: result.message || '抱歉，我无法理解您的需求',
      intentType: result.intentType
    };
    
    // 根据意图添加额外数据
    if (result.success) {
      switch (result.intentType) {
        case 'TICKET_QUERY':
          // 添加车票查询建议
          if (result.data) {
            aiMessage.suggestion = {
              type: 'ticket',
              departure: result.data.departure || '广州',
              destination: result.data.destination,
              date: result.data.date || this.getTodayDate(),
              timeRange: result.data.timeRange
            };
          }
          break;
          
        case 'WEATHER_QUERY':
          // 添加天气信息
          if (result.data && result.data.city) {
            aiMessage.suggestion = {
              type: 'weather',
              city: result.data.city
            };
          }
          break;
      }
    }
    
    // 添加消息到列表
    this.addMessage(aiMessage);
  },
  
  // 获取今天的日期
  getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  // 开始录音
  startRecording() {
    if (this.data.isRecording) return;
    
    // 防止连续点击
    if (this.recordingLock) return;
    this.recordingLock = true;
    
    this.setData({
      isRecording: true,
      recordingText: '松开结束'
    });
    
    // 检查是否有录音权限
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        // 模拟语音识别 - 在实际应用中应使用真实的语音识别API
        this.simulateVoiceRecognition();
      },
      fail: (err) => {
        console.error('获取录音权限失败', err);
        this.setData({
          isRecording: false,
          recordingText: '按住说话'
        });
        wx.showToast({
          title: '未授权录音权限',
          icon: 'none'
        });
        this.recordingLock = false;
      }
    });
  },
  
  // 停止录音
  stopRecording() {
    if (!this.data.isRecording) return;
    
    this.setData({
      isRecording: false,
      recordingText: '按住说话'
    });
    
    // 在真实应用中，这里应该停止录音并处理结果
    clearTimeout(this.voiceTimer);
    
    // 模拟处理延迟
    setTimeout(() => {
      // 重置锁，允许新的录音
      this.recordingLock = false;
      
      // 如果已经有模拟的输入内容，发送它
      if (this.data.inputValue) {
        this.sendMessage();
      }
    }, 500);
  },
  
  // 模拟语音识别 - 在实际应用中应替换为真实的语音识别API
  simulateVoiceRecognition() {
    // 清除之前的计时器
    if (this.voiceTimer) {
      clearTimeout(this.voiceTimer);
    }
    
    // 随机选择一个示例查询
    const exampleQueries = [
      '我明天想从广州去深圳，有什么车票？',
      '珠海天气怎么样？',
      '下周末从广州到佛山的车票',
      '东莞到广州的车票价格是多少'
    ];
    
    const randomQuery = exampleQueries[Math.floor(Math.random() * exampleQueries.length)];
    
    // 将模拟结果设置到输入框
    this.setData({
      inputValue: randomQuery
    });
    
    // 设置2秒后自动结束录音
    this.voiceTimer = setTimeout(() => {
      if (this.data.isRecording) {
        this.stopRecording();
      }
    }, 2000);
  },
  
  // 使用车票查询建议
  useTicketSuggestion(e) {
    const { departure, destination, date } = e.currentTarget.dataset;
    
    if (!departure || !destination || !date) {
      wx.showToast({
        title: '参数不完整',
        icon: 'none'
      });
      return;
    }
    
    // 安全处理参数
    const safeDeparture = departure.replace(/[<>]/g, '');
    const safeDestination = destination.replace(/[<>]/g, '');
    const safeDate = date.replace(/[<>]/g, '');
    
    // 跳转到车票列表页面
    wx.navigateTo({
      url: `/pages/ticket-list/ticket-list?departure=${safeDeparture}&destination=${safeDestination}&date=${safeDate}`
    });
  }
});