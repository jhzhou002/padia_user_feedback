# PADIA 用户反馈平台

（视频说明：[PADIA User Feedback Demo_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1kRZ6Y6E9b/?vd_source=6cebfb74eb1fc5510e18c96ef6974f6f)）
PADIA用户反馈平台是一个专为车企工厂工作者设计的Web应用，用于规范化管理和高效处理PADIA系统使用过程中遇到的问题。

## 项目背景

PADIA是一款用于车企工厂工作者管理车漆相关操作的系统。由于系统使用复杂，用户经常遇到问题需要通过Teams直接联系PO解决，导致PO工作效率低下。本平台旨在建立一个标准化的问题提交和处理流程，减少PO处理用户问题的时间成本，并积累常见问题解决方案供用户参考。

## 技术栈

- 前端框架：Vue 3 + TypeScript
- 构建工具：Vite
- UI组件库：Element Plus
- 富文本编辑器：WangEditor
- HTTP请求：Axios
- 路由管理：Vue Router
- 状态管理：Vue Refs（组合式API）

## 功能特性

### 用户端

1. **问题提交**
   - 选择问题所属模块
   - 使用富文本编辑器详细描述问题（支持格式化、图片粘贴等）
   - 设置问题公开选项

2. **问题列表**
   - 查看个人提交的所有问题
   - 按状态筛选（待处理、正在处理、已处理）
   - 搜索问题功能

3. **热门问题**
   - 浏览已解决的公开问题
   - 按模块筛选热门问题
   - 问题卡片布局，直观易用

4. **问题详情**
   - 查看问题详细信息和处理状态
   - 与开发人员在线沟通
   - 追踪问题状态变更历史

### 开发人员端

1. **任务列表**
   - 查看分配的问题任务
   - 按状态和优先级筛选
   - 任务卡片布局，一目了然

2. **问题处理**
   - 与用户在线沟通
   - 更新问题状态
   - 提交解决方案

### 管理员端

1. **反馈管理**
   - 查看所有用户提交的问题
   - 按状态和可见性筛选
   - 分配问题给开发人员处理

## 安装与使用

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装步骤

1. 克隆项目到本地

```bash
git clone <repository-url>
cd padia-feedback
```

2. 安装依赖

```bash
npm install
# 或
yarn install
```

3. 开发环境运行

```bash
启动前端
npm run dev
# 或
yarn dev

启动后端
cd server
node index.js
```

4. 构建生产环境代码

```bash
npm run build
# 或
yarn build
```

### 项目配置

根据需要，修改以下配置文件：

- `.env`：基础环境变量
- `.env.development`：开发环境特定变量
- `.env.production`：生产环境特定变量

## 项目结构

```
padia-feedback/
├── public/              # 静态资源
├── src/
│   ├── api/             # API接口定义
│   ├── assets/          # 项目资源文件
│   ├── components/      # 公共组件
│   ├── router/          # 路由配置
│   ├── stores/          # 状态管理
│   ├── types/           # TypeScript类型定义
│   ├── utils/           # 工具函数
│   ├── views/           # 页面视图
│   │   ├── admin/       # 管理员页面
│   │   ├── developer/   # 开发人员页面
│   │   └── user/        # 用户页面
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── .env                 # 环境变量
├── index.html           # HTML模板
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript配置
└── vite.config.ts       # Vite配置
```

## 开发者注意事项

1. 遵循TypeScript类型系统，确保代码类型安全
2. 使用Vue 3组合式API开发组件
3. 遵循Element Plus的设计规范
4. 确保各角色页面的权限控制正确实现

## 数据库连接信息

- 用户名：tongyong
- 密码：zhjh0704
- 地址：101.35.218.174
- 数据库：padia_user_feedback

## 协作与贡献

1. 创建分支进行功能开发
2. 提交PR前进行代码自测
3. 遵循团队编码规范

## 许可证

该项目使用私有许可证，未经许可不得用于商业用途。
