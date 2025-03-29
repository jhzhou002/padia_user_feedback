import { initDatabase } from '../src/db/models/index.js'

async function testDatabaseConnection() {
  console.log('测试数据库连接...')
  try {
    const result = await initDatabase()
    if (result) {
      console.log('数据库连接成功！')
    } else {
      console.error('数据库连接失败！')
    }
  } catch (error) {
    console.error('数据库连接错误:', error)
  }
}

testDatabaseConnection().finally(() => {
  console.log('测试完成')
  process.exit()
}) 