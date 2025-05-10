// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { departure, destination, date } = event
  
  try {
    // 查询符合条件的车票
    const ticketsCollection = db.collection('tickets')
    const { data: tickets } = await ticketsCollection
      .where({
        from: departure,
        to: destination,
        date: date
      })
      .get()
    
    return {
      success: true,
      data: tickets
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      errMsg: err.message
    }
  }
} 