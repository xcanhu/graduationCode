// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId, status } = event
  
  try {
    // 查询订单是否属于当前用户
    const { data: orders } = await db.collection('orders')
      .where({
        _id: orderId,
        openid: openid
      })
      .get()
    
    if (!orders || orders.length === 0) {
      return {
        success: false,
        message: '订单不存在或无权操作'
      }
    }
    
    // 更新订单状态
    await db.collection('orders').doc(orderId).update({
      data: {
        status: status,
        updateTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: '订单状态更新成功'
    }
  } catch (err) {
    console.error('更新订单状态失败', err)
    return {
      success: false,
      message: '更新订单状态失败',
      error: err
    }
  }
} 