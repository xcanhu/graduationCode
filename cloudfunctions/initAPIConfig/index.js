// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 初始化DeepSeek API配置
    try {
      // 使用upsert方式，不管文档存在与否，都可以正确设置
      await db.collection('apiConfig').doc('deepseek').set({
        data: {
          apiKey: 'sk-0547226285be4ce993ecdea494246b6e',
          apiUrl: 'https://api.deepseek.chat/v1/chat/completions',
          model: 'deepseek-chat',
          updatedAt: new Date()
        }
      });
      console.log('DeepSeek API配置已设置成功');
      
      return {
        success: true,
        message: 'API配置初始化成功'
      };
    } catch (e) {
      console.error('尝试set文档时出错:', e);
      
      // 如果set失败，尝试insert
      if (e.errCode === -501017) { // 文档已存在
        try {
          await db.collection('apiConfig').doc('deepseek').update({
            data: {
              apiKey: 'sk-0547226285be4ce993ecdea494246b6e',
              apiUrl: 'https://api.deepseek.chat/v1/chat/completions',
              model: 'deepseek-chat',
              updatedAt: new Date()
            }
          });
          console.log('DeepSeek API配置已更新');
          
          return {
            success: true,
            message: 'API配置已更新成功'
          };
        } catch (updateErr) {
          console.error('更新文档时出错:', updateErr);
          throw updateErr;
        }
      } else {
        // 如果set失败且不是因为文档已存在，尝试创建集合并执行add操作
        try {
          try {
            // 创建集合
            await db.createCollection('apiConfig');
            console.log('apiConfig集合创建成功');
          } catch (createErr) {
            console.log('创建集合失败（可能已存在）:', createErr);
          }
          
          // 添加文档
          await db.collection('apiConfig').add({
            data: {
              _id: 'deepseek',
              apiKey: 'sk-0547226285be4ce993ecdea494246b6e',
              apiUrl: 'https://api.deepseek.chat/v1/chat/completions',
              model: 'deepseek-chat',
              updatedAt: new Date()
            }
          });
          console.log('DeepSeek API配置已添加');
          
          return {
            success: true,
            message: 'API配置已添加成功'
          };
        } catch (addErr) {
          console.error('添加文档时出错:', addErr);
          throw addErr;
        }
      }
    }
  } catch (error) {
    console.error('初始化API配置失败', error);
    return {
      success: false,
      message: '初始化API配置失败',
      error: error.message || JSON.stringify(error)
    };
  }
} 