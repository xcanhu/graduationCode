// 使用云开发API

// 模拟车票数据
const ticketsData = [
  {
    id: 1,
    from: '商城',
    to: '合肥',
    date: '2023-12-01',
    time: '08:00',
    duration: '1小时30分钟',
    price: 80,
    seats: 32,
    type: '直达快线'
  },
  {
    id: 2,
    from: '商城',
    to: '合肥',
    date: '2023-12-01',
    time: '12:00',
    duration: '1小时30分钟',
    price: 80,
    seats: 45,
    type: '直达快线'
  },
  {
    id: 3,
    from: '商城',
    to: '合肥',
    date: '2023-12-01',
    time: '16:00',
    duration: '1小时30分钟',
    price: 80,
    seats: 50,
    type: '直达快线'
  },
  {
    id: 4,
    from: '商城',
    to: '全椒',
    date: '2023-12-01',
    time: '09:00',
    duration: '2小时',
    price: 100,
    seats: 40,
    type: '直达快线'
  },
  {
    id: 5,
    from: '商城',
    to: '全椒',
    date: '2023-12-01',
    time: '15:00',
    duration: '2小时',
    price: 100,
    seats: 35,
    type: '直达快线'
  },
  {
    id: 6,
    from: '商城',
    to: '南京',
    date: '2023-12-01',
    time: '08:30',
    duration: '2小时30分钟',
    price: 120,
    seats: 55,
    type: '城际快巴'
  },
  {
    id: 7,
    from: '商城',
    to: '南京',
    date: '2023-12-01',
    time: '14:30',
    duration: '2小时30分钟',
    price: 120,
    seats: 48,
    type: '城际快巴'
  },
  {
    id: 8,
    from: '商城',
    to: '句容',
    date: '2023-12-01',
    time: '09:15',
    duration: '3小时',
    price: 150,
    seats: 38,
    type: '城际快巴'
  },
  {
    id: 9,
    from: '商城',
    to: '镇江',
    date: '2023-12-01',
    time: '10:00',
    duration: '3小时30分钟',
    price: 160,
    seats: 42,
    type: '城际快巴'
  },
  {
    id: 10,
    from: '商城',
    to: '丹阳',
    date: '2023-12-01',
    time: '11:00',
    duration: '3小时45分钟',
    price: 170,
    seats: 36,
    type: '城际快巴'
  },
  {
    id: 11,
    from: '商城',
    to: '常州',
    date: '2023-12-01',
    time: '09:30',
    duration: '4小时',
    price: 180,
    seats: 45,
    type: '城际快巴'
  },
  {
    id: 12,
    from: '商城',
    to: '无锡',
    date: '2023-12-01',
    time: '08:45',
    duration: '4小时30分钟',
    price: 190,
    seats: 40,
    type: '城际快巴'
  },
  {
    id: 13,
    from: '商城',
    to: '苏州',
    date: '2023-12-01',
    time: '08:00',
    duration: '5小时',
    price: 200,
    seats: 50,
    type: '城际快巴'
  },
  {
    id: 14,
    from: '商城',
    to: '苏州',
    date: '2023-12-01',
    time: '13:00',
    duration: '5小时',
    price: 200,
    seats: 45,
    type: '城际快巴'
  }
];

// 模拟天气数据
const weatherData = {
  '商城': {
    temperature: '24°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg'
  },
  '合肥': {
    temperature: '23°C',
    weather: '多云',
    icon: 'https://ai-public.mastergo.com/ai/img_res/24a7112850a923614f21805ea03cfb67.jpg'
  },
  '全椒': {
    temperature: '22°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg'
  },
  '南京': {
    temperature: '21°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg'
  },
  '句容': {
    temperature: '22°C',
    weather: '多云',
    icon: 'https://ai-public.mastergo.com/ai/img_res/24a7112850a923614f21805ea03cfb67.jpg'
  },
  '镇江': {
    temperature: '23°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg'
  },
  '丹阳': {
    temperature: '22°C',
    weather: '多云',
    icon: 'https://ai-public.mastergo.com/ai/img_res/24a7112850a923614f21805ea03cfb67.jpg'
  },
  '常州': {
    temperature: '21°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg'
  },
  '无锡': {
    temperature: '20°C',
    weather: '多云',
    icon: 'https://ai-public.mastergo.com/ai/img_res/24a7112850a923614f21805ea03cfb67.jpg'
  },
  '苏州': {
    temperature: '21°C',
    weather: '晴天',
    icon: 'https://ai-public.mastergo.com/ai/img_res/254dc98fa9f7d5a83048f5e5febcec6b.jpg'
  }
};

// 查询车票
const searchTickets = (departure, destination, date) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'searchTickets',
      data: {
        departure,
        destination,
        date
      }
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve(res.result.data);
      } else {
        reject(new Error(res.result.errMsg || '查询失败'));
      }
    })
    .catch(err => {
      console.error('调用查询车票云函数失败', err);
      reject(err);
    });
  });
};

// 获取天气信息
const getWeather = (city) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getWeather',
      data: {
        city
      }
    })
    .then(res => {
      if (res.result && res.result.success) {
        resolve(res.result.data);
      } else {
        // 返回默认天气数据
        resolve({
          temperature: '暂无数据',
          weather: '暂无数据',
          icon: ''
        });
      }
    })
    .catch(err => {
      console.error('调用获取天气云函数失败', err);
      // 返回默认天气数据
      resolve({
        temperature: '暂无数据',
        weather: '暂无数据',
        icon: ''
      });
    });
  });
};

// AI助手处理自然语言查询
const aiQueryProcess = (query) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'aiQueryProcess',
      data: {
        query
      }
    })
    .then(res => {
      resolve(res.result);
    })
    .catch(err => {
      console.error('调用AI助手云函数失败', err);
      reject(err);
    });
  });
};

// 日期格式化
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 将票价格式化为字符串
const formatPrice = (price) => {
  return `¥${price}`;
};

module.exports = {
  searchTickets,
  getWeather,
  aiQueryProcess,
  formatDate,
  formatPrice
};