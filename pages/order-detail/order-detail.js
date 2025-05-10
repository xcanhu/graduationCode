const api = require('../../utils/cloudapi');

Page({
  data: {
    order: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    
    if (id) {
      this.loadOrderDetail(id);
    } else {
      wx.showToast({
        title: '订单不存在',
        icon: 'none'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  // 加载订单详情
  loadOrderDetail(orderId) {
    this.setData({ loading: true });
    
    api.getOrders()
      .then(orders => {
        const order = orders.find(item => item._id === orderId);
        
        if (order) {
          this.setData({
            order,
            loading: false
          });
        } else {
          wx.showToast({
            title: '订单不存在',
            icon: 'none'
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      })
      .catch(err => {
        console.error('获取订单详情失败', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '获取订单失败',
          icon: 'none'
        });
      });
  },
  
  // 支付订单
  payOrder() {
    const { order } = this.data;
    
    if (!order || order.status !== '待支付') {
      return;
    }
    
    wx.showLoading({ title: '处理中...' });
    
    // 模拟支付流程，实际应该调用微信支付API
    setTimeout(() => {
      api.updateOrderStatus(order._id, '已完成')
        .then(() => {
          wx.hideLoading();
          wx.showToast({
            title: '支付成功',
            icon: 'success'
          });
          
          // 刷新订单状态
          this.loadOrderDetail(order._id);
        })
        .catch(err => {
          console.error('支付失败', err);
          wx.hideLoading();
          wx.showToast({
            title: '支付失败，请重试',
            icon: 'none'
          });
        });
    }, 1500);
  },
  
  // 取消订单
  cancelOrder() {
    const { order } = this.data;
    
    if (!order || order.status !== '待支付') {
      return;
    }
    
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          
          api.updateOrderStatus(order._id, '已取消')
            .then(() => {
              wx.hideLoading();
              wx.showToast({
                title: '订单已取消',
                icon: 'success'
              });
              
              // 刷新订单状态
              this.loadOrderDetail(order._id);
            })
            .catch(err => {
              console.error('取消订单失败', err);
              wx.hideLoading();
              wx.showToast({
                title: '取消失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
}) 