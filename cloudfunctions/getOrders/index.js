// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { status } = event
  
  try {
    let query = { openid }
    
    // 根据状态筛选
    if (status && status !== '全部') {
      query.status = status
    }
    
    // 查询订单
    const { data: orders } = await db.collection('orders')
      .where(query)
      .orderBy('createTime', 'desc')
      .get()
    
    return {
      success: true,
      data: orders
    }
  } catch (err) {
    console.error('查询订单失败', err)
    return {
      success: false,
      message: '查询订单失败',
      error: err
    }
  }
} 