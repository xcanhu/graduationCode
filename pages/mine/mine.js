// pages/mine/mine.js
const api = require('../../utils/cloudapi');
const icons = require('../../utils/icons');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    icons: icons,
    userInfo: {
      nickName: '陈美玲',
      memberType: '白金会员',
      points: 2580,
      balance: 358.00,
      coupons: 12
    },
    hasUserInfo: false,
    isLoading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getUserInfo();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (this.data.hasUserInfo) {
      this.getUserInfo();
    }
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2  // 设置选中项为"我的"
      });
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 获取用户信息
  getUserInfo() {
    this.setData({ isLoading: true });
    
    api.getUserInfo()
      .then(userInfo => {
        this.setData({
          userInfo,
          hasUserInfo: true,
          isLoading: false
        });
      })
      .catch(err => {
        console.error('获取用户信息失败', err);
        this.setData({ isLoading: false });
      });
  },

  // 登录
  login() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        const userInfo = res.userInfo;
        
        api.updateUserInfo({
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender
        })
        .then(() => {
          this.getUserInfo();
        })
        .catch(err => {
          console.error('更新用户信息失败', err);
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        });
      },
      fail: () => {
        wx.showToast({
          title: '您已取消授权',
          icon: 'none'
        });
      }
    });
  },

  // 编辑个人信息
  editUserInfo() {
    wx.navigateTo({
      url: '/pages/user-edit/user-edit'
    });
  },

  // 查看订单
  viewOrders() {
    wx.navigateTo({
      url: '/pages/order/order'
    });
  },

  // 联系客服
  contactService() {
    wx.showToast({
      title: '客服功能开发中',
      icon: 'none'
    });
  },

  // 关于我们
  aboutUs() {
    wx.showToast({
      title: '关于我们功能开发中',
      icon: 'none'
    });
  },

  // 点击购票记录
  navigateToPurchaseRecords() {
    wx.navigateTo({
      url: '/pages/purchase-records/purchase-records'
    });
  },

  // 点击常用乘车人
  navigateToPassengers() {
    wx.navigateTo({
      url: '/pages/passengers/passengers'
    });
  },

  // 点击地址管理
  navigateToAddresses() {
    wx.navigateTo({
      url: '/pages/addresses/addresses'
    });
  },

  // 点击我的收藏
  navigateToFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    });
  },

  // 点击客服中心
  navigateToService() {
    wx.navigateTo({
      url: '/pages/service/service'
    });
  },

  // 点击帮助中心
  navigateToHelp() {
    wx.navigateTo({
      url: '/pages/help/help'
    });
  },

  // 点击意见反馈
  navigateToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 点击关于我们
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  // 安全退出
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '退出成功',
            icon: 'success',
            duration: 2000,
            success: () => {
              // 退出登录逻辑
            }
          });
        }
      }
    });
  }
})