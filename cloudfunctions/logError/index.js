// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { 
      message = '未知错误', 
      level = 'error', 
      timestamp = new Date().toISOString(),
      data = {}
    } = event;
    
    // 获取调用用户信息
    const { OPENID } = cloud.getWXContext();
    
    // 确保敏感数据不被记录
    const sanitizedData = { ...data };
    const sensitiveFields = ['idCard', 'phone', 'password', 'token', 'apiKey'];
    
    sensitiveFields.forEach(field => {
      if (sanitizedData[field]) {
        sanitizedData[field] = '******';
      }
    });
    
    // 添加到错误日志集合
    const result = await db.collection('errorLogs').add({
      data: {
        message,
        level,
        timestamp,
        data: sanitizedData,
        openid: OPENID,
        userAgent: data.userAgent || '',
        createdAt: db.serverDate()
      }
    });
    
    return {
      success: true,
      id: result._id
    };
  } catch (error) {
    console.error('记录错误日志失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 