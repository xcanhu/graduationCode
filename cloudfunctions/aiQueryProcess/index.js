// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { query, sessionId } = event
  
  try {
    // 提取查询意图和实体
    const intent = analyzeIntent(query)
    
    // 根据意图处理不同类型的请求
    switch (intent.type) {
      case 'TICKET_QUERY':
        return handleTicketQuery(intent.entities)
      case 'WEATHER_QUERY':
        return handleWeatherQuery(intent.entities)
      case 'PRICE_QUERY':
        return handlePriceQuery(intent.entities)
      case 'TIME_QUERY':
        return handleTimeQuery(intent.entities)
      case 'GENERAL_INFO':
        return handleGeneralInfo(intent.entities)
      default:
        return {
          success: false,
          message: '抱歉，我无法理解您的需求，请尝试更明确的表达，例如：明天下午去深圳',
          intentType: 'UNKNOWN'
        }
    }
  } catch (err) {
    console.error('处理查询时出错', err)
    return {
      success: false,
      message: '处理您的请求时出现错误，请稍后再试',
      error: err.message,
      intentType: 'ERROR'
    }
  }
}

// 分析用户查询意图
function analyzeIntent(query) {
  // 提取城市名
  const cities = ['商城', '合肥', '全椒', '南京', '句容', '镇江', '丹阳', '常州', '无锡', '苏州']
  let departure = '商城' // 默认出发地
  let destination = null
  
  // 查找目的地
  for (const city of cities) {
    // 检测"从XX到XX"模式
    const fromToPattern = new RegExp(`从(${cities.join('|')})到(${cities.join('|')})`)
    const fromToMatch = query.match(fromToPattern)
    
    if (fromToMatch) {
      departure = fromToMatch[1]
      destination = fromToMatch[2]
      break
    }
    
    // 检测"去XX"或"到XX"模式
    if (query.includes(`去${city}`) || query.includes(`到${city}`)) {
      destination = city
      break
    }
    
    // 直接包含城市名
    if (query.includes(city) && city !== '商城') {
      destination = city
      break
    }
  }
  
  // 提取日期
  let date = null
  const today = new Date()
  
  if (query.includes('今天')) {
    date = formatDate(today)
  } else if (query.includes('明天')) {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    date = formatDate(tomorrow)
  } else if (query.includes('后天')) {
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(today.getDate() + 2)
    date = formatDate(dayAfterTomorrow)
  } else if (query.includes('周末') || query.includes('星期六') || query.includes('星期日')) {
    // 计算下一个周末
    const daysUntilWeekend = (6 - today.getDay() + 7) % 7 || 7
    const weekend = new Date(today)
    weekend.setDate(today.getDate() + daysUntilWeekend)
    date = formatDate(weekend)
  }
  
  // 提取时间段
  let timeRange = null
  if (query.includes('早上') || query.includes('早晨') || query.includes('上午')) {
    timeRange = '上午'
  } else if (query.includes('中午')) {
    timeRange = '中午'
  } else if (query.includes('下午')) {
    timeRange = '下午'
  } else if (query.includes('晚上') || query.includes('夜间')) {
    timeRange = '晚上'
  }
  
  // 提取价格偏好
  let pricePreference = null
  if (query.includes('便宜') || query.includes('经济') || query.includes('实惠')) {
    pricePreference = 'low'
  } else if (query.includes('豪华') || query.includes('舒适')) {
    pricePreference = 'high'
  }
  
  // 确定意图类型 - 默认优先考虑是查询车票
  let intentType = 'TICKET_QUERY'
  
  // 只有明确提到"天气"、"价格"、"时间"等关键词时才转向其他意图
  if (query.includes('天气') || query.includes('温度') || query.includes('下雨')) {
    intentType = 'WEATHER_QUERY'
  } else if (query.includes('多少钱') || query.includes('票价') || query.includes('价格')) {
    intentType = 'PRICE_QUERY'
  } else if (query.includes('几点') || query.includes('什么时候') || query.includes('时刻表')) {
    intentType = 'TIME_QUERY'
  } else if (!destination && (query.includes('退票') || query.includes('行李') || query.includes('车站'))) {
    intentType = 'GENERAL_INFO'
  }
  
  // 如果没有目的地但有日期，我们默认为购票意图，但稍后会提示用户选择目的地
  if (!destination && date) {
    intentType = 'TICKET_QUERY'
  }
  
  return {
    type: intentType,
    entities: {
      departure,
      destination,
      date,
      timeRange,
      pricePreference,
      originalQuery: query
    }
  }
}

// 处理车票查询意图
async function handleTicketQuery(entities) {
  const { departure, destination, date, timeRange, pricePreference } = entities
  
  // 如果没有目的地，返回推荐目的地
  if (!destination) {
    return {
      success: true,
      message: '请选择您想去的城市，我可以帮您查询最优惠的车票：',
      data: {
        departure,
        popularDestinations: ['合肥', '南京', '苏州', '常州'],
        date: date || formatDate(new Date())
      },
      intentType: 'DESTINATION_RECOMMENDATION'
    }
  }
  
  // 如果没有日期，使用今天的日期
  const queryDate = date || formatDate(new Date())
  
  try {
    // 查询车票数据
    const ticketsCollection = db.collection('tickets')
    const query = {
      from: departure,
      to: destination,
      date: queryDate
    }
    
    // 根据时间段过滤
    if (timeRange) {
      // 简单的时间段过滤逻辑
      let timeFilter = {}
      switch(timeRange) {
        case '上午':
          timeFilter = { time: db.command.lt('12:00') }
          break
        case '中午':
          timeFilter = { 
            time: db.command.and(
              db.command.gte('11:00'),
              db.command.lt('14:00')
            )
          }
          break
        case '下午':
          timeFilter = { 
            time: db.command.and(
              db.command.gte('12:00'),
              db.command.lt('18:00')
            )
          }
          break
        case '晚上':
          timeFilter = { time: db.command.gte('18:00') }
          break
      }
      
      // 只尝试添加时间过滤，如果数据库支持的话
      try {
        // 合并查询条件
        Object.assign(query, timeFilter)
      } catch (e) {
        console.error('时间段过滤不支持', e)
      }
    }
    
    const { data: tickets } = await ticketsCollection
      .where(query)
      .orderBy('time', 'asc')
      .get()
    
    // 检查是否找到车票
    if (tickets && tickets.length > 0) {
      // 根据价格偏好筛选票价
      let selectedTickets = [...tickets]
      
      if (pricePreference === 'low') {
        selectedTickets.sort((a, b) => a.price - b.price)
        selectedTickets = selectedTickets.slice(0, 3) // 取最便宜的3个
      } else if (pricePreference === 'high') {
        selectedTickets.sort((a, b) => b.price - a.price)
        selectedTickets = selectedTickets.slice(0, 3) // 取最贵的3个
      }
      
      // 提取最早和最晚的时间以及最低价格
      const earliestTime = tickets[0].time
      const latestTime = tickets[tickets.length - 1].time
      const lowestPrice = Math.min(...tickets.map(t => t.price))
      
      // 准备回复消息
      let message = `我已为您查询到${queryDate}从${departure}到${destination}的车票`
      
      if (timeRange) {
        message += `，${timeRange}发车`
      }
      
      message += `，票价${lowestPrice}元起，共有${tickets.length}个班次可选。点击下方按钮即可查看详情并购票。`
      
      return {
        success: true,
        message: message,
        data: {
          departure,
          destination,
          date: queryDate,
          timeRange,
          pricePreference,
          ticketCount: tickets.length,
          earliestTime,
          latestTime,
          lowestPrice,
          firstTicket: selectedTickets[0] ? {
            time: selectedTickets[0].time,
            price: selectedTickets[0].price
          } : null
        },
        intentType: 'TICKET_QUERY'
      }
    } else {
      // 没有找到车票，提供替代日期建议
      const nextDay = new Date(queryDate)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayFormatted = formatDate(nextDay)
      
      const prevDay = new Date(queryDate)
      prevDay.setDate(prevDay.getDate() - 1)
      const prevDayFormatted = formatDate(prevDay)
      
      return {
        success: false,
        message: `抱歉，${queryDate}从${departure}到${destination}的车票已售罄，您可以尝试以下日期：`,
        data: {
          departure,
          destination,
          alternativeDates: [prevDayFormatted, nextDayFormatted],
          timeRange
        },
        intentType: 'SOLD_OUT'
      }
    }
  } catch (err) {
    console.error('查询车票失败', err)
    return {
      success: false,
      message: `查询车票时出错，请稍后再试。您也可以直接点击下方按钮查看所有从${departure}到${destination}的车票。`,
      data: {
        departure,
        destination,
        date: queryDate
      },
      intentType: 'TICKET_QUERY'
    }
  }
}

// 处理天气查询意图
async function handleWeatherQuery(entities) {
  const { departure, destination } = entities
  let city = destination || departure
  
  try {
    // 查询天气数据
    const weatherCollection = db.collection('weather')
    const { data: weatherData } = await weatherCollection
      .where({ city })
      .get()
    
    if (weatherData && weatherData.length > 0) {
      const weather = weatherData[0]
      
      // 添加购票建议
      let purchaseSuggestion = ""
      if (weather.weather.includes('雨')) {
        purchaseSuggestion = `遇到雨天出行，建议您提前购票，避免在站台等候。要不要看看今天从${departure}到${city}的车票？`
      } else if (weather.weather.includes('晴')) {
        purchaseSuggestion = `天气晴好，非常适合出行。现在就为您查询从${departure}到${city}的车票吗？`
      } else {
        purchaseSuggestion = `查询完天气，要不要顺便看看从${departure}到${city}的车票信息？`
      }
      
      return {
        success: true,
        message: `${city}今天${weather.weather}，温度${weather.temperature}。${purchaseSuggestion}`,
        data: {
          city,
          weather: weather.weather,
          temperature: weather.temperature,
          icon: weather.icon,
          departure,
          destination: city
        },
        intentType: 'WEATHER_QUERY'
      }
    } else {
      return {
        success: false,
        message: `抱歉，没有找到${city}的天气信息。不过您可以查看从${departure}到${city}的车票信息。`,
        data: {
          city,
          departure,
          destination: city
        },
        intentType: 'WEATHER_QUERY'
      }
    }
  } catch (err) {
    console.error('查询天气信息失败', err)
    return {
      success: false,
      message: `查询${city}的天气信息时出错，请稍后再试。您可以先看看从${departure}到${city}的车票信息。`,
      data: {
        city,
        departure,
        destination: city
      },
      intentType: 'WEATHER_QUERY'
    }
  }
}

// 处理价格查询意图
async function handlePriceQuery(entities) {
  const { departure, destination } = entities
  
  if (!destination) {
    return {
      success: false,
      message: '请告诉我您想查询哪个城市的票价，例如：广州到深圳多少钱',
      intentType: 'PRICE_QUERY'
    }
  }
  
  try {
    // 查询车票价格
    const ticketsCollection = db.collection('tickets')
    const { data: tickets } = await ticketsCollection
      .where({
        from: departure,
        to: destination
      })
      .orderBy('price', 'asc')
      .get()
    
    if (tickets && tickets.length > 0) {
      const minPrice = tickets[0].price
      const maxPrice = Math.max(...tickets.map(t => t.price))
      const todayDate = formatDate(new Date())
      
      // 获取今天最早的一班车
      const todayTickets = tickets.filter(t => t.date === todayDate)
      let earliestToday = null
      if (todayTickets.length > 0) {
        todayTickets.sort((a, b) => a.time.localeCompare(b.time))
        earliestToday = todayTickets[0]
      }
      
      let message = `从${departure}到${destination}的车票价格为${minPrice}-${maxPrice}元`
      if (earliestToday) {
        message += `，今天最早一班是${earliestToday.time}，票价${earliestToday.price}元`
      }
      message += `。点击下方按钮即可查看详情并购票。`
      
      return {
        success: true,
        message: message,
        data: {
          departure,
          destination,
          minPrice,
          maxPrice,
          ticketCount: tickets.length,
          earliestToday: earliestToday ? {
            time: earliestToday.time,
            price: earliestToday.price
          } : null
        },
        intentType: 'PRICE_QUERY'
      }
    } else {
      return {
        success: false,
        message: `抱歉，暂无从${departure}到${destination}的车票信息。您可以尝试查询其他热门路线，如：广州到深圳、广州到珠海。`,
        intentType: 'PRICE_QUERY'
      }
    }
  } catch (err) {
    console.error('查询价格信息失败', err)
    return {
      success: false,
      message: `查询价格信息时出错，请稍后再试。您可以直接点击下方按钮查看所有从${departure}到${destination}的车票。`,
      data: {
        departure,
        destination
      },
      intentType: 'PRICE_QUERY'
    }
  }
}

// 处理时间查询意图
async function handleTimeQuery(entities) {
  const { departure, destination, date } = entities
  
  if (!destination) {
    return {
      success: false,
      message: '请告诉我您想查询哪个城市的发车时间，例如：广州到深圳几点有车',
      intentType: 'TIME_QUERY'
    }
  }
  
  const queryDate = date || formatDate(new Date())
  
  try {
    // 查询发车时间
    const ticketsCollection = db.collection('tickets')
    const { data: tickets } = await ticketsCollection
      .where({
        from: departure,
        to: destination,
        date: queryDate
      })
      .orderBy('time', 'asc')
      .get()
    
    if (tickets && tickets.length > 0) {
      // 获取所有发车时间
      const times = tickets.map(ticket => ticket.time)
      
      // 将时间分为上午、下午、晚上三类
      const morningTimes = times.filter(t => t < '12:00').slice(0, 3)
      const afternoonTimes = times.filter(t => t >= '12:00' && t < '18:00').slice(0, 3)
      const eveningTimes = times.filter(t => t >= '18:00').slice(0, 3)
      
      let timeInfo = ''
      if (morningTimes.length > 0) {
        timeInfo += `上午: ${morningTimes.join('、')} `
      }
      if (afternoonTimes.length > 0) {
        timeInfo += `下午: ${afternoonTimes.join('、')} `
      }
      if (eveningTimes.length > 0) {
        timeInfo += `晚上: ${eveningTimes.join('、')}`
      }
      
      return {
        success: true,
        message: `${queryDate}从${departure}到${destination}共有${tickets.length}个班次，包括：${timeInfo}。点击下方按钮查看详细车次并购票。`,
        data: {
          departure,
          destination,
          date: queryDate,
          times,
          morningTimes,
          afternoonTimes,
          eveningTimes,
          ticketCount: tickets.length
        },
        intentType: 'TIME_QUERY'
      }
    } else {
      // 尝试查找其他日期的车票
      const nextDate = new Date(queryDate)
      nextDate.setDate(nextDate.getDate() + 1)
      const nextDateStr = formatDate(nextDate)
      
      const { data: nextDayTickets } = await ticketsCollection
        .where({
          from: departure,
          to: destination,
          date: nextDateStr
        })
        .limit(1)
        .get()
      
      if (nextDayTickets && nextDayTickets.length > 0) {
        return {
          success: false,
          message: `抱歉，${queryDate}没有从${departure}到${destination}的车次，但${nextDateStr}有车。要查看明天的车票吗？`,
          data: {
            departure,
            destination,
            date: nextDateStr
          },
          intentType: 'TIME_QUERY'
        }
      } else {
        return {
          success: false,
          message: `抱歉，没有找到${queryDate}从${departure}到${destination}的车次信息。您可以尝试查询其他热门路线，如：广州到深圳、广州到珠海。`,
          intentType: 'TIME_QUERY'
        }
      }
    }
  } catch (err) {
    console.error('查询发车时间失败', err)
    return {
      success: false,
      message: `查询发车时间时出错，请稍后再试。您可以直接点击下方按钮查看所有从${departure}到${destination}的车票。`,
      data: {
        departure,
        destination,
        date: queryDate
      },
      intentType: 'TIME_QUERY'
    }
  }
}

// 处理一般咨询
function handleGeneralInfo(entities) {
  const { originalQuery, departure, destination } = entities
  
  // 常见问题回答，每个回答都添加购票引导
  if (originalQuery.includes('退票')) {
    return {
      success: true,
      message: '乘车前2小时可以申请退票，收取10%手续费；乘车前30分钟内不可退票。您可以在"我的订单"中操作退票。您是打算购买车票吗？请告诉我您的出发地和目的地。',
      data: {
        showTicketButton: true,
        departure,
        popularDestinations: ['合肥', '南京', '苏州', '常州']
      },
      intentType: 'GENERAL_INFO'
    }
  } else if (originalQuery.includes('行李') || originalQuery.includes('托运')) {
    return {
      success: true,
      message: '每位乘客可免费携带20kg以内行李，超出部分需额外付费。贵重物品请随身携带，易碎品和违禁品不能托运。准备好出行计划了吗？请告诉我您要去哪里，我来为您查询车票。',
      data: {
        showTicketButton: true,
        departure,
        popularDestinations: ['合肥', '南京', '苏州', '常州']
      },
      intentType: 'GENERAL_INFO'
    }
  } else if (originalQuery.includes('儿童') || originalQuery.includes('小孩')) {
    return {
      success: true,
      message: '1.2米以下儿童可免费乘车，但需有成人陪同；1.2-1.5米儿童购买半价票；1.5米以上需购买全价票。需要为您和孩子购买车票吗？请告诉我您的出行计划。',
      data: {
        showTicketButton: true,
        departure,
        popularDestinations: ['合肥', '南京', '苏州', '常州']
      },
      intentType: 'GENERAL_INFO'
    }
  } else if (originalQuery.includes('车站') || originalQuery.includes('在哪里')) {
    let city = destination || '商城'
    let stationInfo = ''
    
    switch (city) {
      case '商城':
        stationInfo = '商城汽车客运站位于商城市中心区域，可乘坐公交车1路、2路、3路到达。'
        break
      case '合肥':
        stationInfo = '合肥汽车站位于合肥市站前路1号，可乘坐地铁1号线到达。'
        break
      case '南京':
        stationInfo = '南京汽车站位于南京市中山东路17号，可乘坐地铁1号线或3号线到达。'
        break
      default:
        stationInfo = `${city}汽车站信息可在出行前通过客服电话咨询。`
    }
    
    return {
      success: true,
      message: `${stationInfo} 需要查询前往${city}的车票信息吗？`,
      data: {
        showTicketButton: true,
        departure,
        destination: city
      },
      intentType: 'GENERAL_INFO'
    }
  }
  
  // 默认回复
  return {
    success: true,
    message: `您好，我是巴士售票小程序的AI助手，可以帮您查询车票、天气、价格等信息。请问您想去哪里？我可以为您推荐以下热门目的地。`,
    data: {
      showTicketButton: true,
      departure,
      popularDestinations: ['合肥', '南京', '苏州', '常州']
    },
    intentType: 'GENERAL_INFO'
  }
}

// 日期格式化
function formatDate(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
} 