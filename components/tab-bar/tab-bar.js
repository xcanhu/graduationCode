const icons = require('../../utils/icons');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    selected: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    tabList: [
      {
        pagePath: "/pages/home/home",
        text: "首页",
        iconPath: icons.tabBarIcons.home,
        selectedIconPath: icons.tabBarIcons.homeActive
      },
      {
        pagePath: "/pages/order/order",
        text: "订单",
        iconPath: icons.tabBarIcons.order,
        selectedIconPath: icons.tabBarIcons.orderActive
      },
      {
        pagePath: "/pages/mine/mine",
        text: "我的",
        iconPath: icons.tabBarIcons.mine,
        selectedIconPath: icons.tabBarIcons.mineActive
      }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.tabList[index];
      
      if (this.data.selected === index) {
        return;
      }
      
      wx.switchTab({
        url: item.pagePath
      });
    }
  }
}) 