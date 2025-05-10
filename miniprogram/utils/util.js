// 工具函数

// 格式化时间
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

// 数字补零
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 获取当前日期
const getCurrentDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  return `${year}-${formatNumber(month)}-${formatNumber(day)}`
}

// 显示加载提示
const showLoading = (title = '加载中') => {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载提示
const hideLoading = () => {
  wx.hideLoading()
}

// 显示消息提示
const showToast = (title, icon = 'none') => {
  wx.showToast({
    title,
    icon,
    duration: 2000
  })
}

module.exports = {
  formatTime,
  formatNumber,
  getCurrentDate,
  showLoading,
  hideLoading,
  showToast
} 