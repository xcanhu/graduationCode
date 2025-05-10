// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const {
    nickName,
    avatarUrl,
    gender,
    phone,
    name,
    idCard
  } = event
  
  try {
    // 查询用户是否已存在
    const { data: users } = await db.collection('users')
      .where({ openid: openid })
      .get()
    
    if (users && users.length > 0) {
      // 更新用户信息
      await db.collection('users').doc(users[0]._id).update({
        data: {
          nickName,
          avatarUrl,
          gender,
          phone,
          name,
          idCard,
          updateTime: db.serverDate()
        }
      })
    } else {
      // 创建新用户
      await db.collection('users').add({
        data: {
          openid,
          nickName,
          avatarUrl,
          gender,
          phone,
          name,
          idCard,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }
    
    return {
      success: true,
      message: '用户信息更新成功'
    }
  } catch (err) {
    console.error('更新用户信息失败', err)
    return {
      success: false,
      message: '更新用户信息失败',
      error: err
    }
  }
} 