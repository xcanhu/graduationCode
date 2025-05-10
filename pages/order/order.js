// pages/order/order.js
const api = require('../../utils/cloudapi');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabs: ['全部', '待付款', '待出行', '已完成'],
    activeTab: 0,
    orders: [],
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadOrders();
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
    this.loadOrders();
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
    this.loadOrders();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以实现加载更多订单
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 加载订单数据
  loadOrders() {
    const status = this.data.tabs[this.data.activeTab];
    this.setData({ loading: true });
    
    // 模拟订单数据
    setTimeout(() => {
      const orders = [
        {
          _id: '202312050001',
          orderNo: '202312050001',
          status: '待付款',
          departure: '广州南站',
          destination: '深圳北站',
          date: '2023年12月5日',
          time: '14:30',
          price: '68.00',
          passengerName: '张三',
          passengerIdCard: '440123********1234',
          createTime: '2023-12-04 15:30:45'
        },
        {
          _id: '202312040002',
          orderNo: '202312040002',
          status: '待出行',
          departure: '深圳北站',
          destination: '东莞南站',
          date: '2023年12月6日',
          time: '09:30',
          price: '35.00',
          passengerName: '李四',
          passengerIdCard: '440123********5678',
          createTime: '2023-12-04 10:15:20'
        },
        {
          _id: '202312030003',
          orderNo: '202312030003',
          status: '已完成',
          departure: '广州东站',
          destination: '佛山南站',
          date: '2023年12月3日',
          time: '10:30',
          price: '25.00',
          passengerName: '王五',
          passengerIdCard: '440123********9012',
          createTime: '2023-12-01 09:45:32'
        }
      ];
      
      // 根据当前选中的标签过滤订单
      let filteredOrders = orders;
      if (this.data.activeTab !== 0) {
        filteredOrders = orders.filter(order => order.status === status);
      }
      
      this.setData({
        orders: filteredOrders,
        loading: false
      });
    }, 500);
  },

  // 切换标签
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
    this.loadOrders();
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    });
  },

  // 支付订单
  payOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showLoading({ title: '处理中...' });
    
    // 模拟支付流程，实际应该调用微信支付API
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      });
      
      // 更新本地订单状态，实际项目中应向服务器提交更新
      const orders = this.data.orders.map(order => {
        if (order._id === orderId) {
          return {...order, status: '待出行'};
        }
        return order;
      });
      
      this.setData({ orders });
    }, 1500);
  },

  // 再次购买
  rebuyTicket(e) {
    const orderId = e.currentTarget.dataset.id;
    
    // 找到对应的订单
    const order = this.data.orders.find(item => item._id === orderId);
    
    if (order) {
      // 跳转到购票页面，并传递相关信息
      wx.navigateTo({
        url: `/pages/ticket-list/ticket-list?departure=${order.departure}&destination=${order.destination}&date=${order.date.replace(/年|月/g, '-').replace('日', '')}`
      });
    }
  }
})