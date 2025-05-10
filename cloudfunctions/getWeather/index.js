// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { city } = event
  
  try {
    // 查询城市天气数据
    const weatherCollection = db.collection('weather')
    const { data } = await weatherCollection.where({
      city: city
    }).get()
    
    if (data && data.length > 0) {
      return {
        success: true,
        data: data[0]
      }
    } else {
      return {
        success: false,
        errMsg: '未找到该城市的天气数据'
      }
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      errMsg: err.message
    }
  }
} 