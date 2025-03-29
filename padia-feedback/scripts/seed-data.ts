import { User, Issue, Task, Comment, UserRole, IssueStatus, IssuePriority, initDatabase } from '../src/db/models'

// 添加示例数据
async function seedData() {
  console.log('正在初始化数据库...')
  
  try {
    // 初始化数据库
    const initialized = await initDatabase()
    if (!initialized) {
      console.error('数据库初始化失败，无法添加示例数据')
      return
    }
    
    console.log('开始添加示例数据...')
    
    // 创建用户
    const adminUser = await User.findOne({ where: { username: 'admin' } })
    const devUser = await User.findOne({ where: { username: 'developer' } })
    
    // 创建普通用户
    const user1 = await User.findOrCreate({
      where: { username: 'user1' },
      defaults: {
        username: 'user1',
        email: 'user1@example.com',
        password: 'user123',
        role: UserRole.USER
      }
    })
    
    const user2 = await User.findOrCreate({
      where: { username: 'user2' },
      defaults: {
        username: 'user2',
        email: 'user2@example.com',
        password: 'user123',
        role: UserRole.USER
      }
    })
    
    console.log('用户数据添加完成')
    
    // 创建问题
    const issues = [
      {
        title: '富文本编辑器使用问题',
        description: '<p>我在使用富文本编辑器时，无法正常上传图片，请问如何解决？</p>',
        status: IssueStatus.PENDING,
        userId: user1[0].id,
        isPublic: true,
        priority: IssuePriority.MEDIUM,
        views: 15
      },
      {
        title: '系统无法登录',
        description: '<p>今天早上系统突然无法登录，提示"用户名或密码错误"，但我确定密码没有问题。</p>',
        status: IssueStatus.PROCESSING,
        userId: user1[0].id,
        isPublic: true,
        priority: IssuePriority.HIGH,
        views: 42
      },
      {
        title: '数据导出功能异常',
        description: '<p>在尝试导出车漆数据时，系统提示"导出失败"，请问如何解决？</p>',
        status: IssueStatus.RESOLVED,
        userId: user2[0].id,
        isPublic: true,
        priority: IssuePriority.MEDIUM,
        views: 28
      },
      {
        title: '批量上传功能建议',
        description: '<p>希望系统能增加批量上传图片的功能，目前一次只能上传一张图片，效率太低。</p>',
        status: IssueStatus.PENDING,
        userId: user2[0].id,
        isPublic: true,
        priority: IssuePriority.LOW,
        views: 10
      },
      {
        title: '页面加载速度慢',
        description: '<p>系统在加载大量数据时非常慢，特别是在查看历史记录页面时，请优化一下。</p>',
        status: IssueStatus.PROCESSING,
        userId: user1[0].id,
        isPublic: true,
        priority: IssuePriority.HIGH,
        views: 35
      },
      {
        title: '操作权限问题',
        description: '<p>我是部门主管，但无法查看团队成员的操作记录，请确认是否权限设置有误。</p>',
        status: IssueStatus.CLOSED,
        userId: user2[0].id,
        isPublic: false,
        priority: IssuePriority.MEDIUM,
        views: 8
      },
      {
        title: '数据统计图表显示异常',
        description: '<p>在数据统计页面，柱状图显示不完整，有时还会出现数据错位的情况。</p>',
        status: IssueStatus.PENDING,
        userId: user1[0].id,
        isPublic: true,
        priority: IssuePriority.MEDIUM,
        views: 20
      },
      {
        title: '系统通知功能建议',
        description: '<p>建议增加系统通知功能，当有重要更新或者问题处理进展时，能够及时通知用户。</p>',
        status: IssueStatus.PENDING,
        userId: user2[0].id,
        isPublic: true,
        priority: IssuePriority.LOW,
        views: 15
      },
      {
        title: '车漆颜色匹配问题',
        description: '<p>系统中的颜色匹配算法似乎有问题，相同的车漆在不同批次会显示不同的匹配结果。</p>',
        status: IssueStatus.PROCESSING,
        userId: user1[0].id,
        isPublic: true,
        priority: IssuePriority.HIGH,
        views: 50
      },
      {
        title: '用户手册需要更新',
        description: '<p>当前的用户手册与系统实际功能不符，有些新功能在手册中完全没有提及。</p>',
        status: IssueStatus.RESOLVED,
        userId: user2[0].id,
        isPublic: true,
        priority: IssuePriority.MEDIUM,
        views: 30
      }
    ]
    
    // 添加问题
    for (const issueData of issues) {
      const [issue, created] = await Issue.findOrCreate({
        where: { title: issueData.title },
        defaults: issueData
      })
      
      // 如果问题状态是处理中或已解决，则创建任务
      if ((issue.status === IssueStatus.PROCESSING || issue.status === IssueStatus.RESOLVED) && created) {
        await Task.create({
          issueId: issue.id,
          assignedTo: devUser.id,
          priority: issue.priority,
          remark: '请尽快处理该问题'
        })
      }
      
      // 为每个问题添加一些评论
      if (created) {
        if (issue.status === IssueStatus.PROCESSING || issue.status === IssueStatus.RESOLVED) {
          await Comment.create({
            content: '我们已经收到您的问题，正在处理中...',
            userId: devUser.id,
            issueId: issue.id
          })
        }
        
        if (issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.CLOSED) {
          await Comment.create({
            content: '问题已解决，请确认是否可以关闭。',
            userId: devUser.id,
            issueId: issue.id
          })
          
          await Comment.create({
            content: '感谢您的帮助，问题已经解决。',
            userId: issue.userId,
            issueId: issue.id
          })
        }
      }
    }
    
    console.log('示例数据添加完成')
    
  } catch (error) {
    console.error('添加示例数据失败:', error)
  }
}

// 执行添加示例数据
seedData().finally(() => {
  console.log('脚本执行完成')
  process.exit()
}) 