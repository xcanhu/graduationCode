const api = require('../../utils/cloudapi');
const icons = require('../../utils/icons');

Page({
  data: {
    startDate: '',
    endDate: '',
    selectedDate: '',
    formatDisplayDate: '',
    weekDay: '',
    departure: '商城',
    destination: '合肥',
    currentDate: '',
    aiInput: '',
    aiProcessing: false,
    icons: icons,
    cities: [
      {
        name: '合肥',
        image: '/assets/images/cities/shenzhen.png'
      },
      {
        name: '南京',
        image: '/assets/images/cities/zhuhai.png'
      },
      {
        name: '苏州',
        image: '/assets/images/cities/foshan.png'
      },
      {
        name: '常州',
        image: '/assets/images/cities/dongguan.png'
      }
    ],
    routes: [
      {
        id: 1,
        from: '商城',
        to: '合肥',
        description: '每日多班 | 1小时30分钟直达',
        price: 80,
        image: '/assets/images/routes/gz-sz.png'
      },
      {
        id: 2,
        from: '商城',
        to: '南京',
        description: '每日多班 | 2小时30分钟直达',
        price: 120,
        image: '/assets/images/routes/gz-zh.png'
      },
      {
        id: 3,
        from: '商城',
        to: '苏州',
        description: '每日多班 | 5小时直达',
        price: 200,
        image: '/assets/images/routes/gz-fs.png'
      }
    ],
    promotions: [
      {
        id: 1,
        title: '新用户专享',
        description: '首单立减 ¥10',
        image: '/assets/images/promotions/new_user.png'
      },
      {
        id: 2,
        title: '学生特惠',
        description: '周末往返优惠',
        image: '/assets/images/promotions/student.png'
      },
      {
        id: 3,
        title: '团体出行',
        description: '5人以上享8折',
        image: '/assets/images/promotions/group.png'
      }
    ]
  },

  onLoad() {
    // 设置日期选择器的起始日期范围
    const today = new Date()
    const endDate = new Date()
    endDate.setDate(today.getDate() + 30)  // 可以选择未来30天

    const formattedToday = this.formatDate(today)
    
    this.setData({
      startDate: formattedToday,
      endDate: this.formatDate(endDate),
      selectedDate: formattedToday,
      formatDisplayDate: this.formatDisplayDate(today),
      weekDay: this.getWeekDay(today),
      currentDate: `${(today.getMonth() + 1)}月${today.getDate()}日`
    })
    
    // 获取出发地和目的地的天气信息
    this.getWeatherInfo();
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  formatDisplayDate(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  },
  
  getWeekDay(date) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekDays[date.getDay()]
  },

  bindDateChange(e) {
    const selectedDate = e.detail.value
    const date = new Date(selectedDate)
    
    this.setData({
      selectedDate: selectedDate,
      formatDisplayDate: this.formatDisplayDate(date),
      weekDay: this.getWeekDay(date)
    })
  },

  exchangeLocations() {
    const { departure, destination } = this.data
    this.setData({
      departure: destination,
      destination: departure
    })

    // 更新路线展示，使其与当前选择的出发地和目的地匹配
    this.updateRoutes(destination, departure);
  },

  // 添加更新路线的函数
  updateRoutes(departure, destination) {
    // 根据当前出发地和目的地更新路线信息
    const updatedRoutes = this.data.routes.map(route => {
      if ((route.from === departure && route.to === destination) ||
          (route.from === this.data.departure && route.to === this.data.destination)) {
        // 将匹配的路线置顶
        return { ...route, priority: 1 };
      }
      return { ...route, priority: 0 };
    });
    
    // 按优先级排序
    updatedRoutes.sort((a, b) => b.priority - a.priority);
    
    this.setData({
      routes: updatedRoutes
    });
  },

  // 处理出发地输入
  onDepartureInput(e) {
    this.setData({
      departure: e.detail.value
    });
  },

  // 处理目的地输入
  onDestinationInput(e) {
    this.setData({
      destination: e.detail.value
    });
  },

  selectCity(e) {
    const type = e.currentTarget.dataset.type
    const city = e.currentTarget.dataset.city
    if (city) {
      this.setData({
        [type]: city
      })
    } else {
      wx.showToast({
        title: '城市选择功能开发中',
        icon: 'none'
      })
    }
  },

  searchTickets() {
    const { departure, destination, selectedDate } = this.data
    if (!departure || !destination) {
      wx.showToast({
        title: '请选择出发地和目的地',
        icon: 'none'
      })
      return
    }
    if (!selectedDate) {
      wx.showToast({
        title: '请选择出发日期',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: `/pages/ticket-list/ticket-list?departure=${departure}&destination=${destination}&date=${selectedDate}`
    })
  },

  inputAiQuery(e) {
    this.setData({
      aiInput: e.detail.value
    });
  },

  processAiQuery() {
    const { aiInput } = this.data;
    if (!aiInput) {
      wx.showToast({
        title: '请输入您的出行需求',
        icon: 'none'
      });
      return;
    }

    // 检查输入是否包含可能导致API错误的特殊字符
    const hasSpecialChars = /[\[\]》《【】]/.test(aiInput);
    if (hasSpecialChars) {
      // 提示用户并尝试清理输入
      const cleanInput = aiInput.replace(/[\[\]》《【】]/g, '');
      this.setData({
        aiInput: cleanInput
      });
      
      wx.showToast({
        title: '已移除特殊字符',
        icon: 'none',
        duration: 1000
      });
      
      // 如果清理后内容为空，不继续处理
      if (!cleanInput.trim()) {
        return;
      }
    }

    this.setData({ aiProcessing: true });

    // 使用DeepSeek API处理查询
    api.deepseekChat(this.data.aiInput)
      .then(result => {
        this.setData({ aiProcessing: false });
        
        // 即使API返回错误，只要有message字段，我们也继续处理
        if (result.success || result.message) {
          // 直接使用用户输入的内容跳转到AI助手页面
          wx.navigateTo({
            url: `/pages/ai-assistant/ai-assistant?query=${encodeURIComponent(this.data.aiInput)}`
          });
        } else {
          throw new Error(result.error || '无法处理请求');
        }
      })
      .catch(err => {
        console.error('处理AI查询失败', err);
        this.setData({ aiProcessing: false });
        
        let errorMessage = '处理请求失败，请重试';
        
        // 根据错误类型提供具体提示
        if (err.message) {
          if (err.message.includes('网络连接安全问题')) {
            errorMessage = 'AI服务连接异常，请稍后再试';
          } else if (err.message.includes('超时')) {
            errorMessage = '请求超时，请检查网络连接';
          } else if (err.message.includes('无效的查询参数')) {
            errorMessage = '请输入有效的查询内容';
          }
        }
        
        wx.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 2000
        });
      });
  },

  viewRouteDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '路线详情功能开发中',
      icon: 'none'
    })
  },

  viewPromotionDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '优惠活动详情功能开发中',
      icon: 'none'
    })
  },

  navigateToMine() {
    wx.navigateTo({
      url: '/pages/mine/mine'
    });
  },

  navigateToOrder() {
    wx.navigateTo({
      url: '/pages/order/order'
    });
  },
  
  navigateToAiAssistant() {
    wx.navigateTo({
      url: '/pages/ai-assistant/ai-assistant'
    });
  },

  // 添加获取天气信息的函数
  getWeatherInfo() {
    const { departure, destination } = this.data;
    
    if (departure) {
      api.getWeather(departure)
        .then(weatherData => {
          this.setData({
            departureWeather: weatherData
          });
        })
        .catch(err => {
          console.error('获取出发地天气信息失败', err);
        });
    }
    
    if (destination) {
      api.getWeather(destination)
        .then(weatherData => {
          this.setData({
            destinationWeather: weatherData
          });
        })
        .catch(err => {
          console.error('获取目的地天气信息失败', err);
        });
    }
  },
})