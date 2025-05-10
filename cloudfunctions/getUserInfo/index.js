// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 查询用户信息
    const { data: users } = await db.collection('users')
      .where({ openid: openid })
      .get()
    
    if (users && users.length > 0) {
      // 用户已存在
      return {
        success: true,
        data: users[0]
      }
    } else {
      // 用户不存在
      return {
        success: false,
        message: '用户不存在'
      }
    }
  } catch (err) {
    console.error('获取用户信息失败', err)
    return {
      success: false,
      message: '获取用户信息失败',
      error: err
    }
  }
} 