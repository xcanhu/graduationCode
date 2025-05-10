const api = require('../../utils/cloudapi');

Page({
  data: {
    ticket: null,
    passengerName: '',
    passengerPhone: '',
    passengerIdCard: '',
    loading: false
  },

  onLoad(options) {
    // 从路由参数获取车票信息
    const ticket = {
      id: options.id,
      departure: options.departure,
      destination: options.destination,
      date: options.date,
      time: options.time,
      price: options.price,
      type: options.type,
      seats: options.seats || 30
    };
    
    this.setData({ ticket });
    
    // 尝试获取用户信息
    this.getUserInfo();
  },
  
  // 获取用户信息
  getUserInfo() {
    api.getUserInfo()
      .then(userInfo => {
        if (userInfo) {
          this.setData({
            passengerName: userInfo.name || '',
            passengerPhone: userInfo.phone || '',
            passengerIdCard: userInfo.idCard || ''
          });
        }
      })
      .catch(err => {
        console.error('获取用户信息失败', err);
      });
  },
  
  // 输入框内容变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },
  
  // 提交订单
  submitOrder() {
    const { ticket, passengerName, passengerPhone, passengerIdCard } = this.data;
    
    // 表单验证
    if (!this.validateFormData()) {
      return;
    }
    
    this.setData({ loading: true });
    
    // 创建订单
    api.createOrder({
      ticketId: ticket.id,
      departure: ticket.departure,
      destination: ticket.destination,
      date: ticket.date,
      time: ticket.time,
      price: parseFloat(ticket.price), // 确保价格是数字
      type: ticket.type,
      seats: parseInt(ticket.seats, 10), // 确保座位数是整数
      passengerName,
      passengerPhone,
      passengerIdCard
    })
    .then(result => {
      this.setData({ loading: false });
      
      if (!result || !result.orderId) {
        throw new Error('创建订单失败，未返回订单ID');
      }
      
      wx.showModal({
        title: '下单成功',
        content: '是否立即前往支付？',
        success: res => {
          if (res.confirm) {
            wx.navigateTo({
              url: `/pages/order-detail/order-detail?id=${result.orderId}`
            });
          } else {
            wx.navigateBack();
          }
        }
      });
    })
    .catch(err => {
      console.error('创建订单失败', err);
      this.setData({ loading: false });
      wx.showToast({
        title: err.message || '下单失败，请重试',
        icon: 'none'
      });
    });
  },
  
  // 验证表单数据
  validateFormData() {
    const { passengerName, passengerPhone, passengerIdCard } = this.data;
    
    // 姓名验证
    if (!passengerName || passengerName.trim() === '') {
      wx.showToast({
        title: '请输入乘客姓名',
        icon: 'none'
      });
      return false;
    }
    
    // 手机号验证
    if (!passengerPhone) {
      wx.showToast({
        title: '请输入手机号码',
        icon: 'none'
      });
      return false;
    }
    
    // 手机号格式验证
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(passengerPhone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return false;
    }
    
    // 身份证号验证
    if (!passengerIdCard) {
      wx.showToast({
        title: '请输入身份证号',
        icon: 'none'
      });
      return false;
    }
    
    // 身份证号格式验证
    const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    if (!idCardReg.test(passengerIdCard)) {
      wx.showToast({
        title: '身份证号格式不正确',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },
  
  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
}) 