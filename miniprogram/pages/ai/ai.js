const utils = require('../../utils/util.js');
const api = require('../../utils/cloudapi.js');

Page({
  data: {
    conversationHistory: [],
    chatHistory: [], // DeepSeek聊天历史记录
    inputValue: '',
    scrollToView: '',
    isLoading: false,
    showActions: false,
    useDeepSeek: true, // 是否使用DeepSeek API
    welcomeShown: false // 是否已显示欢迎消息
  },

  onLoad: function (options) {
    // 如果有搜索参数自动填充
    if (options.query) {
      this.setData({
        inputValue: options.query
      });
    }
    
    // 添加欢迎消息
    this.addSystemMessage();
  },
  
  // 添加系统欢迎消息
  addSystemMessage: function() {
    // 确保欢迎消息只显示一次
    if (this.data.welcomeShown) {
      return;
    }
    
    const welcomeMessage = {
      type: 'assistant',
      text: '您好！我是您的智能出行助手，可以帮您：\n- 查询车票信息和价格\n- 推荐热门目的地\n- 查看天气情况\n- 提供出行建议\n请告诉我您的出行需求。',
      time: new Date().toLocaleTimeString()
    };
    
    this.updateConversationHistory(welcomeMessage);
    
    // 标记欢迎消息已显示
    this.setData({
      welcomeShown: true
    });
  },
  
  // 用户输入变化
  onInputChange: function(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },
  
  // 清空聊天记录
  clearConversation: function() {
    this.setData({
      conversationHistory: [],
      chatHistory: [], // 同时清空DeepSeek聊天历史
      showActions: false,
      welcomeShown: false // 重置欢迎消息标记
    }, () => {
      this.addSystemMessage();
      wx.showToast({
        title: '聊天记录已清空',
        icon: 'success',
        duration: 1500
      });
    });
  },
  
  // 切换操作菜单显示
  toggleActions: function() {
    this.setData({
      showActions: !this.data.showActions
    });
  },
  
  // 切换AI模型
  toggleAIModel: function() {
    this.setData({
      useDeepSeek: !this.data.useDeepSeek
    }, () => {
      wx.showToast({
        title: this.data.useDeepSeek ? '已切换到DeepSeek AI' : '已切换到基础AI',
        icon: 'none',
        duration: 1500
      });
    });
  },
  
  // 发送消息
  sendMessage: function() {
    const { inputValue } = this.data;
    
    // 如果输入为空，不处理
    if (!inputValue.trim()) {
      return;
    }
    
    // 关闭操作菜单（如果打开）
    if (this.data.showActions) {
      this.setData({
        showActions: false
      });
    }
    
    // 添加用户消息到历史记录
    this.updateConversationHistory({
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString()
    });
    
    // 更新聊天历史
    const chatHistory = [...this.data.chatHistory];
    chatHistory.push({
      role: 'user',
      content: inputValue
    });
    
    // 清空输入框并显示加载状态
    this.setData({
      inputValue: '',
      isLoading: true,
      chatHistory
    });
    
    // 添加加载状态
    this.updateConversationHistory({
      type: 'loading'
    });
    
    // 调用AI处理
    if (this.data.useDeepSeek) {
      // 使用DeepSeek AI
      this.processWithDeepSeek(inputValue, chatHistory);
    } else {
      // 使用原有的AI处理
      this.processWithAI(inputValue);
    }
  },
  
  // 使用DeepSeek AI处理用户输入
  processWithDeepSeek: function(query, chatHistory) {
    wx.showLoading({
      title: '正在思考中...',
      mask: true
    });
    
    api.deepseekChat(query, chatHistory).then(res => {
      console.log('DeepSeek AI响应：', res);
      wx.hideLoading();
      
      // 先移除加载状态消息
      let history = this.data.conversationHistory;
      history = history.filter(item => item.type !== 'loading');
      
      // 更新聊天历史，添加AI回复
      const updatedChatHistory = [...this.data.chatHistory];
      updatedChatHistory.push({
        role: 'assistant',
        content: res.message
      });
      
      this.setData({
        conversationHistory: history,
        isLoading: false,
        chatHistory: updatedChatHistory
      });
      
      // 处理AI回复并添加到历史记录
      const formattedMessage = this.formatAIMessage(res);
      this.updateConversationHistory(formattedMessage);
      
    }).catch(err => {
      console.error('DeepSeek AI处理失败', err);
      wx.hideLoading();
      
      // 移除加载状态
      let history = this.data.conversationHistory;
      history = history.filter(item => item.type !== 'loading');
      
      // 添加错误消息
      this.updateConversationHistory({
        type: 'assistant',
        text: '抱歉，我暂时无法回答您的问题，请稍后再试。' + (err.errMsg || ''),
        time: new Date().toLocaleTimeString()
      });
      
      this.setData({
        conversationHistory: history,
        isLoading: false
      });
    });
  },
  
  // 使用原有AI处理用户输入
  processWithAI: function(query) {
    wx.showLoading({
      title: '正在思考中...',
      mask: true
    });
    
    api.aiQueryProcess(query).then(res => {
      console.log('AI响应：', res);
      wx.hideLoading();
      
      // 先移除加载状态消息
      let history = this.data.conversationHistory;
      history = history.filter(item => item.type !== 'loading');
      this.setData({
        conversationHistory: history,
        isLoading: false
      });
      
      // 处理AI回复并添加到历史记录
      const formattedMessage = this.formatAIMessage(res);
      this.updateConversationHistory(formattedMessage);
      
    }).catch(err => {
      console.error('AI处理失败', err);
      wx.hideLoading();
      
      // 移除加载状态
      let history = this.data.conversationHistory;
      history = history.filter(item => item.type !== 'loading');
      
      // 添加错误消息
      this.updateConversationHistory({
        type: 'assistant',
        text: '抱歉，我无法理解您的需求，请尝试更明确的表达，例如：明天下午去深圳',
        time: new Date().toLocaleTimeString()
      });
      
      this.setData({
        conversationHistory: history,
        isLoading: false
      });
    });
  },
  
  // 更新对话历史
  updateConversationHistory: function(message) {
    const history = [...this.data.conversationHistory, message];
    const scrollToView = `msg-${history.length - 1}`;
    
    this.setData({
      conversationHistory: history,
      scrollToView: scrollToView
    });
  },

  // 点击车票卡片跳转到票务列表页面
  goToTicketList: function(e) {
    const { departure, destination, date } = e.currentTarget.dataset;
    
    // 记录用户操作
    this.updateConversationHistory({
      type: 'action',
      text: `用户查看了${departure}到${destination}的车票信息`
    });
    
    // 跳转到票务列表页面
    wx.navigateTo({
      url: `/pages/ticket-list/index?departure=${departure}&destination=${destination}&date=${date}`
    });
  },
  
  // 使用推荐建议
  useSuggestion: function(e) {
    const { type, departure, destination, date } = e.currentTarget.dataset;
    
    // 根据建议类型执行不同操作
    if (type === 'ticket' || type === 'destination') {
      // 记录用户操作
      this.updateConversationHistory({
        type: 'action',
        text: `用户选择了${departure}到${destination}的车票`
      });
      
      // 跳转到票务列表页面
      wx.navigateTo({
        url: `/pages/ticket-list/index?departure=${departure}&destination=${destination}&date=${date}`
      });
    } else if (type === 'weather') {
      // 生成天气查询
      const query = `${destination}天气怎么样`;
      this.setData({ inputValue: query });
      this.sendMessage();
    } else if (type === 'price') {
      // 生成价格查询
      const query = `${departure}到${destination}的票价`;
      this.setData({ inputValue: query });
      this.sendMessage();
    } else {
      // 直接使用文本作为查询
      const text = e.currentTarget.dataset.text;
      this.setData({ inputValue: text });
      this.sendMessage();
    }
  },
  
  // 根据AI响应格式化消息，添加车票推荐按钮
  formatAIMessage: function (response) {
    // 处理消息文本
    let formattedMessage = {
      type: 'assistant',
      text: response.message,
      time: new Date().toLocaleTimeString(),
      suggestions: []
    };
    
    // 添加车票信息卡片
    if (response.data && response.data.departure && response.data.destination) {
      // 如果是车票查询相关意图，添加车票卡片
      if (['TICKET_QUERY', 'PRICE_QUERY', 'TIME_QUERY'].includes(response.intentType)) {
        formattedMessage.ticketInfo = {
          departure: response.data.departure,
          destination: response.data.destination,
          date: response.data.date || this.getCurrentDate(),
          earliestTime: response.data.earliestTime,
          latestTime: response.data.latestTime,
          lowestPrice: response.data.lowestPrice || response.data.minPrice,
          ticketCount: response.data.ticketCount
        };
      }
    }
    
    // 根据意图类型添加不同的建议
    switch (response.intentType) {
      case 'TICKET_QUERY':
      case 'SOLD_OUT':
      case 'PRICE_QUERY':
      case 'TIME_QUERY':
        // 添加查看车票按钮 (如果没有卡片)
        if (!formattedMessage.ticketInfo) {
          formattedMessage.suggestions.push({
            type: 'ticket',
            text: '查看车票',
            data: {
              departure: response.data.departure,
              destination: response.data.destination,
              date: response.data.date || this.getCurrentDate()
            }
          });
        }
        
        // 如果是售罄状态，添加替代日期建议
        if (response.intentType === 'SOLD_OUT' && response.data.alternativeDates) {
          response.data.alternativeDates.forEach(date => {
            formattedMessage.suggestions.push({
              type: 'ticket',
              text: date + ' 车票',
              data: {
                departure: response.data.departure,
                destination: response.data.destination,
                date: date
              }
            });
          });
        }
        break;
        
      case 'WEATHER_QUERY':
        // 在天气查询中也添加车票建议
        if (response.data && response.data.departure && response.data.destination) {
          formattedMessage.suggestions.push({
            type: 'ticket',
            text: '查看车票',
            data: {
              departure: response.data.departure,
              destination: response.data.destination,
              date: this.getCurrentDate()
            }
          });
        }
        
        // 添加天气相关建议
        if (response.data && response.data.destination) {
          formattedMessage.suggestions.push({
            type: 'weather',
            text: '未来天气预报',
            data: {
              destination: response.data.destination
            }
          });
        }
        break;
        
      case 'DESTINATION_RECOMMENDATION':
        // 为推荐的每个目的地添加一个快捷按钮
        if (response.data && response.data.popularDestinations) {
          response.data.popularDestinations.forEach(city => {
            formattedMessage.suggestions.push({
              type: 'destination',
              text: city,
              data: {
                departure: response.data.departure,
                destination: city,
                date: response.data.date || this.getCurrentDate()
              }
            });
          });
        }
        break;
        
      case 'GENERAL_INFO':
        // 为一般信息查询添加购票入口
        if (response.data && response.data.showTicketButton) {
          if (response.data.destination) {
            // 如果有特定目的地
            formattedMessage.suggestions.push({
              type: 'ticket',
              text: '查看车票',
              data: {
                departure: response.data.departure,
                destination: response.data.destination,
                date: this.getCurrentDate()
              }
            });
          } else if (response.data.popularDestinations) {
            // 添加热门目的地建议
            response.data.popularDestinations.forEach(city => {
              formattedMessage.suggestions.push({
                type: 'destination',
                text: city,
                data: {
                  departure: response.data.departure,
                  destination: city,
                  date: this.getCurrentDate()
                }
              });
            });
          }
        }
        break;
    }
    
    return formattedMessage;
  },

  // 获取当前日期字符串 YYYY-MM-DD
  getCurrentDate: function() {
    return utils.getCurrentDate();
  }
}) 