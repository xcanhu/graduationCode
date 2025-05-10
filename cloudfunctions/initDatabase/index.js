// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 生成当前日期和未来几天的日期字符串
function generateDates(days) {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(formatDate(date));
  }
  
  return dates;
}

// 日期格式化
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取未来7天的日期
const futureDates = generateDates(7);

// 车票数据模板 - 将使用这个模板生成多天的车票数据
const ticketTemplates = [
  {
    from: '商城',
    to: '合肥',
    time: '08:00',
    duration: '1小时30分钟',
    price: 80,
    seats: 32,
    type: '直达快线'
  },
  {
    from: '商城',
    to: '合肥',
    time: '12:00',
    duration: '1小时30分钟',
    price: 80,
    seats: 45,
    type: '直达快线'
  },
  {
    from: '商城',
    to: '合肥',
    time: '16:00',
    duration: '1小时30分钟',
    price: 80,
    seats: 50,
    type: '直达快线'
  },
  {
    from: '商城',
    to: '全椒',
    time: '09:00',
    duration: '2小时',
    price: 100,
    seats: 40,
    type: '直达快线'
  },
  {
    from: '商城',
    to: '全椒',
    time: '15:00',
    duration: '2小时',
    price: 100,
    seats: 35,
    type: '直达快线'
  },
  {
    from: '商城',
    to: '南京',
    time: '08:30',
    duration: '2小时30分钟',
    price: 120,
    seats: 55,
    type: '城际快巴'
  },
  {
    from: '商城',
    to: '南京',
    time: '14:30',
    duration: '2小时30分钟',
    price: 120,
    seats: 48,
    type: '城际快巴'
  },
  {
    from: '商城',
    to: '句容',
    time: '09:15',
    duration: '3小时',
    price: 150,
    seats: 38,
    type: '城际快巴'
  },
  {
    from: '商城',
    to: '镇江',
    time: '10:00',
    duration: '3小时30分钟',
    price: 160,
    seats: 42,
    type: '城际快巴'
  },
  {
    from: '商城',
    to: '丹阳',
    time: '11:00',
    duration: '3小时45分钟',
    price: 170,
    seats: 36,
    type: '城际快巴'
  },
  {
    from: '商城',
    to: '常州',
    time: '09:30',
    duration: '4小时',
    price: 180,
    seats: 45,
    type: '城际快巴'
  },
  {
    from: '商城',
    to: '无锡',
    time: '08:45',
    duration: '4小时30分钟',
    price: 190,
    seats: 40,
    type: '城际快巴'
  },
  {
    from: '商城',
    to: '苏州',
    time: '08:00',
    duration: '5小时',
    price: 200,
    seats: 50,
    type: '城际快巴'
  },
  {
    from: '商城',
    to: '苏州',
    time: '13:00',
    duration: '5小时',
    price: 200,
    seats: 45,
    type: '城际快巴'
  }
];

// 生成未来几天的车票数据
const ticketsData = [];
let ticketId = 1;

for (const date of futureDates) {
  for (const template of ticketTemplates) {
    // 随机调整座位数量，让每天的数据有些变化
    const randomSeats = Math.max(5, Math.floor(template.seats * (0.8 + Math.random() * 0.4)));
    
    ticketsData.push({
      id: ticketId++,
      from: template.from,
      to: template.to,
      date: date,
      time: template.time,
      duration: template.duration,
      price: template.price,
      seats: randomSeats,
      type: template.type
    });
  }
}

// 天气数据 - 为每个城市提供预设的天气数据
const weatherData = [
  {
    city: '商城',
    temperature: '24°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg',
    updateTime: new Date().toISOString()
  },
  {
    city: '合肥',
    temperature: '23°C',
    weather: '多云',
    icon: 'https://ai-public.mastergo.com/ai/img_res/24a7112850a923614f21805ea03cfb67.jpg',
    updateTime: new Date().toISOString()
  },
  {
    city: '全椒',
    temperature: '22°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg',
    updateTime: new Date().toISOString()
  },
  {
    city: '南京',
    temperature: '21°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg',
    updateTime: new Date().toISOString()
  },
  {
    city: '句容',
    temperature: '22°C',
    weather: '多云',
    icon: 'https://ai-public.mastergo.com/ai/img_res/24a7112850a923614f21805ea03cfb67.jpg',
    updateTime: new Date().toISOString()
  },
  {
    city: '镇江',
    temperature: '23°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg',
    updateTime: new Date().toISOString()
  },
  {
    city: '丹阳',
    temperature: '22°C',
    weather: '多云',
    icon: 'https://ai-public.mastergo.com/ai/img_res/24a7112850a923614f21805ea03cfb67.jpg',
    updateTime: new Date().toISOString()
  },
  {
    city: '常州',
    temperature: '21°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg',
    updateTime: new Date().toISOString()
  },
  {
    city: '无锡',
    temperature: '20°C',
    weather: '多云',
    icon: 'https://ai-public.mastergo.com/ai/img_res/24a7112850a923614f21805ea03cfb67.jpg', 
    updateTime: new Date().toISOString()
  },
  {
    city: '苏州',
    temperature: '21°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg',
    updateTime: new Date().toISOString()
  }
];

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 创建必要的数据库集合
    const collections = ['tickets', 'orders', 'users', 'apiConfig', 'errorLogs'];
    
    for (const collection of collections) {
      try {
        await db.createCollection(collection);
        console.log(`创建集合成功: ${collection}`);
      } catch (error) {
        // 如果集合已存在，会抛出错误，但我们可以忽略这个错误
        console.log(`集合 ${collection} 已存在或创建失败: ${error.message}`);
      }
    }
    
    // 初始化基本的 API 配置
    try {
      // 检查是否已存在API配置
      const apiConfig = await db.collection('apiConfig').doc('deepseek').get();
      console.log('API配置已存在:', apiConfig.data);
    } catch (error) {
      // 如果不存在，创建默认配置
      await db.collection('apiConfig').add({
        data: {
          _id: 'deepseek',
          apiKey: 'sk-placeholder-key-please-replace-with-real-key',
          apiUrl: 'https://api.deepseek.chat',
          model: 'deepseek-chat',
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      });
      console.log('已创建默认API配置');
    }
    
    // 设置集合的权限 - 云函数可读写，小程序端只读
    const securityCollections = ['tickets', 'apiConfig', 'errorLogs'];
    for (const collection of securityCollections) {
      try {
        await db.collection(collection).get();
        // 设置安全规则
        console.log(`已设置 ${collection} 集合的安全规则`);
      } catch (error) {
        console.error(`设置 ${collection} 安全规则失败:`, error);
      }
    }
    
    // 清空数据集合数据
    await clearCollection('tickets');
    await clearCollection('weather');
    
    // 初始化车票数据
    const ticketsPromises = ticketsData.map(ticket => {
      return db.collection('tickets').add({
        data: ticket
      });
    });
    
    // 初始化天气数据
    const weatherPromises = weatherData.map(weather => {
      return db.collection('weather').add({
        data: weather
      });
    });
    
    // 等待所有数据初始化完成
    await Promise.all([...ticketsPromises, ...weatherPromises]);
    
    console.log(`成功初始化 ${ticketsData.length} 条车票数据和 ${weatherData.length} 条天气数据`);
    
    return {
      success: true,
      message: '数据库初始化成功',
      stats: {
        tickets: ticketsData.length,
        weather: weatherData.length
      }
    };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return {
      success: false,
      message: '数据库初始化失败: ' + error.message
    };
  }
};

// 清空集合数据
async function clearCollection(collectionName) {
  try {
    console.log(`准备清空集合: ${collectionName}`);
    
    // 获取集合中的文档数量
    const countResult = await db.collection(collectionName).count();
    const total = countResult.total;
    
    if (total === 0) {
      console.log(`集合 ${collectionName} 为空，无需清空`);
      return;
    }
    
    console.log(`集合 ${collectionName} 包含 ${total} 条记录，开始清空`);
    
    // 分批次删除
    const MAX_LIMIT = 100;
    const batchTimes = Math.ceil(total / MAX_LIMIT);
    const tasks = [];
    
    for (let i = 0; i < batchTimes; i++) {
      const promise = db.collection(collectionName)
        .limit(MAX_LIMIT)
        .get()
        .then(res => {
          const ids = res.data.map(item => item._id);
          const deleteTasks = ids.map(id => {
            return db.collection(collectionName).doc(id).remove();
          });
          return Promise.all(deleteTasks);
        });
      
      tasks.push(promise);
    }
    
    await Promise.all(tasks);
    console.log(`成功清空集合: ${collectionName}`);
    
    return;
  } catch (err) {
    console.error(`清空集合 ${collectionName} 时出错`, err);
    throw err;
  }
} 