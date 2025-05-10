// 云函数调用API

// 处理AI查询
function aiQueryProcess(query) {
  return wx.cloud.callFunction({
    name: 'aiQueryProcess',
    data: { query }
  }).then(res => {
    return res.result;
  });
}

// 使用DeepSeek聊天AI处理查询
function deepseekChat(query, historyMessages = []) {
  return wx.cloud.callFunction({
    name: 'deepseekChat',
    data: { 
      query,
      historyMessages
    }
  }).then(res => {
    return res.result;
  });
}

// 导出API
module.exports = {
  aiQueryProcess,
  deepseekChat
}; 