const api = require('../../utils/cloudapi');

Page({
  data: {
    userInfo: null,
    name: '',
    phone: '',
    idCard: '',
    loading: true,
    saving: false
  },

  onLoad() {
    this.getUserInfo();
  },
  
  // 获取用户信息
  getUserInfo() {
    this.setData({ loading: true });
    
    api.getUserInfo()
      .then(userInfo => {
        if (userInfo) {
          this.setData({
            userInfo,
            name: userInfo.name || '',
            phone: userInfo.phone || '',
            idCard: userInfo.idCard || '',
            loading: false
          });
        } else {
          this.setData({ loading: false });
        }
      })
      .catch(err => {
        console.error('获取用户信息失败', err);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '获取信息失败，请重试',
          icon: 'none'
        });
      });
  },
  
  // 输入框内容变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },
  
  // 保存用户信息
  saveUserInfo() {
    const { userInfo, name, phone, idCard } = this.data;
    
    // 表单验证
    if (!name) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }
    
    if (!phone) {
      wx.showToast({
        title: '请输入手机号码',
        icon: 'none'
      });
      return;
    }
    
    if (!idCard) {
      wx.showToast({
        title: '请输入身份证号',
        icon: 'none'
      });
      return;
    }
    
    // 手机号格式验证
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }
    
    // 身份证号格式验证（简单验证）
    const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    if (!idCardReg.test(idCard)) {
      wx.showToast({
        title: '身份证号格式不正确',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ saving: true });
    
    // 更新用户信息
    api.updateUserInfo({
      nickName: userInfo ? userInfo.nickName : '',
      avatarUrl: userInfo ? userInfo.avatarUrl : '',
      gender: userInfo ? userInfo.gender : 0,
      name,
      phone,
      idCard
    })
    .then(() => {
      this.setData({ saving: false });
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    })
    .catch(err => {
      console.error('保存用户信息失败', err);
      this.setData({ saving: false });
      
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    });
  },
  
  // 取消编辑
  cancelEdit() {
    wx.navigateBack();
  }
}) 