import { testConnection, initDatabase } from '../src/db/models'

// 测试数据库连接
async function testDB() {
  console.log('正在测试数据库连接...')
  
  try {
    // 测试连接
    const connected = await testConnection()
    console.log('数据库连接测试结果:', connected ? '成功' : '失败')
    
    if (connected) {
      // 初始化数据库
      console.log('正在初始化数据库...')
      const initialized = await initDatabase()
      console.log('数据库初始化结果:', initialized ? '成功' : '失败')
    }
  } catch (error) {
    console.error('数据库测试失败:', error)
  }
}

// 执行测试
testDB().finally(() => {
  console.log('测试完成')
  process.exit()
}) 