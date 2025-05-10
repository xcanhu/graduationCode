// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 订单信息
  const { 
    ticketId, 
    departure, 
    destination, 
    date, 
    time, 
    price, 
    passengerName, 
    passengerPhone, 
    passengerIdCard,
    type,
    seats
  } = event
  
  try {
    // 创建订单
    const orderResult = await db.collection('orders').add({
      data: {
        openid,
        ticketId,
        departure,
        destination,
        date,
        time,
        price,
        passengerName,
        passengerPhone,
        passengerIdCard,
        type,
        seats,
        status: '待支付',
        createTime: db.serverDate(),
        orderNo: generateOrderNo()
      }
    })
    
    return {
      success: true,
      message: '订单创建成功',
      data: {
        orderId: orderResult._id
      }
    }
  } catch (err) {
    console.error('创建订单失败', err)
    return {
      success: false,
      message: '订单创建失败',
      error: err
    }
  }
}

// 生成订单号
function generateOrderNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `BUS${year}${month}${date}${hour}${minutes}${seconds}${random}`
} 