// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// DeepSeek API配置
const db = cloud.database()

// 安全验证输入内容
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // 移除可能导致问题的特殊字符
  return input.trim()
    .replace(/[\[\]》《【】]/g, '')
    .substring(0, 1000); // 限制长度
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { 
    query, // 用户查询文本
    historyMessages = [], // 历史消息记录
    userInfo // 用户信息
  } = event;
  
  try {
    // 检查查询是否为空
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new Error('查询内容为空');
    }
    
    // 安全处理输入
    const safeQuery = sanitizeInput(query);
    if (!safeQuery) {
      throw new Error('查询内容无效');
    }
    
    // 从数据库中获取API密钥
    const configCollection = db.collection('apiConfig');
    let apiConfig;
    
    try {
      const configResult = await configCollection.doc('deepseek').get();
      apiConfig = configResult.data;
    } catch (dbError) {
      console.error('获取API配置失败:', dbError);
      throw new Error('无法获取API配置');
    }
    
    if (!apiConfig || !apiConfig.apiKey) {
      throw new Error('API配置不完整');
    }
    
    const DEEPSEEK_API_KEY = apiConfig.apiKey;
    const DEEPSEEK_API_URL = apiConfig.apiUrl || 'https://api.deepseek.chat';
    
    // 安全处理历史消息
    const safeHistoryMessages = Array.isArray(historyMessages) 
      ? historyMessages.map(msg => ({
          role: ['user', 'assistant', 'system'].includes(msg.role) ? msg.role : 'user',
          content: sanitizeInput(msg.content || '')
        })).filter(msg => msg.content)
      : [];
    
    // 构建请求消息
    const messages = [
      {
        role: 'system',
        content: `你是一个智能出行助手，专门帮助用户查询车票、了解天气、提供出行建议等。
                  以下是一些重要指南：
                  1. 回答应简洁明了，用户友好
                  2. 如果用户询问车票相关信息，主动询问出发地、目的地和日期
                  3. 对于天气查询，主动关联相关出行建议
                  4. 始终保持礼貌，使用中文回答
                  5. 如果无法确定用户需求，提供几个选项引导用户`
      },
      // 添加历史消息
      ...safeHistoryMessages,
      // 添加用户当前消息
      {
        role: 'user',
        content: safeQuery
      }
    ];
    
    console.log('正在调用DeepSeek API，消息数量:', messages.length);
    
    // 准备请求数据
    const requestData = {
      model: apiConfig.model || 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    };
    
    // 创建请求配置 - 不再禁用SSL验证
    const config = {
      method: 'post',
      url: DEEPSEEK_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 BusTicket MiniProgram'
      },
      data: requestData,
      timeout: 30000, // 30秒超时
      validateStatus: (status) => status < 500 // 接受任何非500错误，便于处理
    };
    
    // 记录调用请求
    console.log('正在发送API请求到:', DEEPSEEK_API_URL);
    
    // 调用DeepSeek API
    const response = await axios(config);
    
    // 检查响应状态
    if (response.status !== 200) {
      throw new Error(`API返回错误: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
    // 处理API响应
    const aiResponse = response.data;
    if (!aiResponse || !aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      throw new Error('API返回格式无效');
    }
    
    const aiMessage = aiResponse.choices[0].message.content;
    
    // 提取结构化数据
    const structuredData = extractStructuredData(aiMessage, safeQuery);
    
    // 返回处理结果
    return {
      success: true,
      message: aiMessage,
      intentType: structuredData.intentType,
      data: structuredData.data
    };
    
  } catch (error) {
    console.error('处理查询失败:', error);
    
    // 记录详细错误信息
    let errorDetails = '';
    let errorType = 'UNKNOWN_ERROR';
    let errorMessage = '处理请求失败';
    
    if (error.response) {
      // 请求成功发出且服务器返回了响应
      errorDetails = `状态码: ${error.response.status}, 数据: ${JSON.stringify(error.response.data)}`;
      errorType = 'API_RESPONSE_ERROR';
      errorMessage = `API响应错误 (${error.response.status})`;
    } else if (error.request) {
      // 请求已经发出，但没有收到响应
      errorDetails = `未收到响应: ${error.request}`;
      errorType = 'API_REQUEST_ERROR';
      errorMessage = '连接API服务失败';
      
      // 特别处理网络错误
      if (error.message) {
        if (error.message.includes('ECONNREFUSED')) {
          errorType = 'CONNECTION_REFUSED';
          errorMessage = 'API服务连接被拒绝';
        } else if (error.message.includes('timeout')) {
          errorType = 'REQUEST_TIMEOUT';
          errorMessage = 'API请求超时';
        }
      }
    } else {
      // 发生了一些事情，导致请求被触发
      errorDetails = `错误: ${error.message}`;
      
      if (error.message.includes('API配置')) {
        errorType = 'CONFIG_ERROR';
        errorMessage = '系统配置错误';
      }
    }
    
    console.error('详细错误:', errorDetails);
    console.error('错误类型:', errorType);
    
    // 将错误信息记录到数据库中
    try {
      await db.collection('errorLogs').add({
        data: {
          type: errorType,
          details: errorDetails,
          query: event.query || '',
          timestamp: db.serverDate(),
          openid: context.userInfo?.openId
        }
      });
      console.log('错误已记录到数据库');
    } catch (logError) {
      console.error('记录错误到数据库失败:', logError);
    }
    
    // 返回用户友好的错误消息
    return {
      success: false,
      message: `很抱歉，${errorMessage}，请稍后再试。`,
      intentType: 'ERROR',
      error: errorType,
      query: sanitizeInput(event.query || '')
    };
  }
};

// 从AI回复中提取结构化数据
function extractStructuredData(message, query) {
  // 默认数据结构
  const result = {
    intentType: 'GENERAL_INFO',
    data: {
      showTicketButton: false
    }
  };
  
  // 识别可能的意图
  if (message.includes('车票') || 
      message.includes('班次') || 
      message.includes('出发') || 
      message.includes('到达') ||
      query.includes('去') || 
      query.includes('票')) {
    
    result.intentType = 'TICKET_QUERY';
    
    // 提取城市信息
    const cities = ['广州', '深圳', '珠海', '佛山', '东莞', '中山', '惠州', '江门', '肇庆'];
    let departure = '广州'; // 默认出发地
    let destination = null;
    
    // 从查询和回复中提取目的地
    for (const city of cities) {
      if (query.includes(`去${city}`) || query.includes(`到${city}`)) {
        destination = city;
        break;
      }
    }
    
    // 检查"从XX到XX"模式
    const fromToPattern = new RegExp(`从(${cities.join('|')})到(${cities.join('|')})`);
    const queryMatch = query.match(fromToPattern);
    const messageMatch = message.match(fromToPattern);
    
    if (queryMatch) {
      departure = queryMatch[1];
      destination = queryMatch[2];
    } else if (messageMatch) {
      departure = messageMatch[1];
      destination = messageMatch[2];
    }
    
    // 提取日期
    const datePattern = /(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?)|([今明后]天)|(周[一二三四五六日末])/;
    const dateMatch = query.match(datePattern) || message.match(datePattern);
    let date = null;
    
    if (dateMatch) {
      if (dateMatch[0].includes('今天')) {
        date = formatDate(new Date());
      } else if (dateMatch[0].includes('明天')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = formatDate(tomorrow);
      } else if (dateMatch[0].includes('后天')) {
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        date = formatDate(dayAfterTomorrow);
      }
      // 其他日期格式可以根据需要添加处理
    } else {
      // 默认使用今天
      date = formatDate(new Date());
    }
    
    result.data = {
      departure,
      destination,
      date,
      showTicketButton: true
    };
    
    // 如果没有目的地，则可能是需要推荐
    if (!destination) {
      result.intentType = 'DESTINATION_RECOMMENDATION';
      result.data.popularDestinations = ['深圳', '珠海', '佛山', '东莞'];
    }
  } 
  // 检测天气查询意图
  else if (message.includes('天气') || message.includes('温度') || query.includes('天气')) {
    result.intentType = 'WEATHER_QUERY';
    
    // 提取城市信息
    const cities = ['广州', '深圳', '珠海', '佛山', '东莞', '中山', '惠州', '江门', '肇庆', '商城'];
    let destination = null;
    
    for (const city of cities) {
      if (query.includes(city) || message.includes(city)) {
        destination = city;
        break;
      }
    }
    
    result.data = {
      city: destination || '广州',
      temperature: '25°C',
      weather: '晴天',
      showTicketButton: destination ? true : false
    };
  }
  // 检测价格查询意图
  else if (message.includes('价格') || message.includes('票价') || message.includes('多少钱')) {
    result.intentType = 'PRICE_QUERY';
    
    // 提取城市信息，同上
    const cities = ['广州', '深圳', '珠海', '佛山', '东莞', '中山', '惠州', '江门', '肇庆'];
    let departure = '广州'; // 默认出发地
    let destination = null;
    
    // 检查"从XX到XX"模式
    const fromToPattern = new RegExp(`(${cities.join('|')})到(${cities.join('|')})`);
    const queryMatch = query.match(fromToPattern);
    const messageMatch = message.match(fromToPattern);
    
    if (queryMatch) {
      departure = queryMatch[1];
      destination = queryMatch[2];
    } else if (messageMatch) {
      departure = messageMatch[1];
      destination = messageMatch[2];
    }
    
    result.data = {
      departure,
      destination,
      showTicketButton: (departure && destination) ? true : false
    };
  }
  
  return result;
}

// 日期格式化函数
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
} 