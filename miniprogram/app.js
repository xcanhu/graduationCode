App({
  onLaunch: function() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-0gqrxxj9dc24bc6b', // 替换为你的环境ID
        traceUser: true,
      })
      
      // 预热云函数，减少首次调用的延迟
      this.preWarmCloudFunctions();
    }
    
    this.globalData = {
      userInfo: null
    }
  },
  
  // 预热云函数，减少首次调用的延迟
  preWarmCloudFunctions: function() {
    try {
      // 预热deepseekChat云函数
      wx.cloud.callFunction({
        name: 'deepseekChat',
        data: {
          query: 'hello',
          historyMessages: []
        }
      }).then(res => {
        console.log('预热deepseekChat云函数成功');
      }).catch(err => {
        console.error('预热deepseekChat云函数失败:', err);
      });
    } catch (e) {
      console.error('预热云函数异常:', e);
    }
  }
}) 