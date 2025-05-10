// 云函数部署脚本
// 用于一键部署所有云函数和环境

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 云函数目录
const CLOUD_FUNCTIONS_DIR = path.join(__dirname, 'cloudfunctions');

// 获取所有云函数
function getCloudFunctions() {
  try {
    return fs.readdirSync(CLOUD_FUNCTIONS_DIR).filter(file => {
      const stats = fs.statSync(path.join(CLOUD_FUNCTIONS_DIR, file));
      return stats.isDirectory();
    });
  } catch (error) {
    console.error('获取云函数列表失败:', error);
    return [];
  }
}

// 安装依赖
function installDependencies(functionName) {
  return new Promise((resolve, reject) => {
    const functionPath = path.join(CLOUD_FUNCTIONS_DIR, functionName);
    
    console.log(`正在为 ${functionName} 安装依赖...`);
    
    exec('npm install', { cwd: functionPath }, (error, stdout, stderr) => {
      if (error) {
        console.error(`${functionName} 依赖安装失败:`, error);
        reject(error);
        return;
      }
      
      console.log(`${functionName} 依赖安装成功`);
      resolve();
    });
  });
}

// 部署云函数
function deployFunction(functionName) {
  return new Promise((resolve, reject) => {
    console.log(`正在部署云函数 ${functionName}...`);
    
    // 这里需要替换为真实的部署命令
    // 例如: wx-cli deploy-cloud-function
    exec(`echo "模拟部署 ${functionName}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`${functionName} 部署失败:`, error);
        reject(error);
        return;
      }
      
      console.log(`${functionName} 部署成功`);
      resolve();
    });
  });
}

// 批量部署
async function deployAllFunctions() {
  const functions = getCloudFunctions();
  
  if (functions.length === 0) {
    console.log('没有找到云函数');
    return;
  }
  
  console.log(`找到 ${functions.length} 个云函数: ${functions.join(', ')}`);
  
  for (const functionName of functions) {
    try {
      await installDependencies(functionName);
      await deployFunction(functionName);
      console.log(`云函数 ${functionName} 部署完成`);
    } catch (error) {
      console.error(`云函数 ${functionName} 部署失败:`, error);
    }
  }
  
  console.log('所有云函数部署完成');
}

// 执行部署
deployAllFunctions().catch(console.error); 