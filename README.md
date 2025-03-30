# PADIA用户反馈平台

## 项目概述

PADIA用户反馈平台是为车企工厂工作者提供的问题反馈系统，旨在解决PADIA系统使用过程中遇到的问题，提高问题处理效率，减少PO的工作负担。该平台支持用户提交问题、查看问题处理状态，同时为开发人员提供任务管理和处理功能。

## 主要功能

### 用户功能

- **问题提交**：用户可以提交详细的问题描述（支持富文本编辑、图片上传）
- **智能标题生成**：系统自动根据问题描述生成标题，无需用户手动输入
- **问题列表**：查看自己提交的所有问题及其处理状态
- **热门问题**：浏览高频问题和解决方案

### 开发人员功能

- **任务列表**：查看并处理分配给自己的问题
- **任务处理**：更新问题状态、与用户沟通
- **数据统计**：查看问题处理效率和用户满意度

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite + Element Plus
- **后端**：Node.js + Express
- **数据库**：MySQL + Sequelize
- **编辑器**：基于WangEditor的富文本编辑器
- **图片存储**：七牛云存储

## 安装与运行

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 5.7

### 安装步骤

1. 克隆项目代码

```bash
git clone [项目仓库地址]
cd padia-feedback
```

2. 安装依赖

```bash
npm install
```

3. 配置数据库

编辑 `server/.env` 文件，配置数据库连接信息（代码中已经配置，不用再次配置，当然你也可以修改成自己的数据库）。



4. 启动服务

```bash
# 启动后端服务
cd server
npm run start

# 启动前端开发服务器
cd ..
npm run dev
```

## 模块说明

### 用户模块

- **用户注册/登录**：支持用户注册、登录功能
- **问题管理**：提交、查看和跟踪问题
- **问题沟通**：通过评论与开发人员沟通

### 开发人员模块

- **任务处理**：处理分配的任务，更新状态
- **模块划分**：按功能模块自动分配任务
- **数据统计**：任务处理效率和用户满意度统计

### 管理员模块

- **用户管理**：管理用户账号
- **模块管理**：管理系统功能模块
- **系统监控**：监控系统运行状态

## 项目特色

1. **智能标题生成**：自动根据问题描述生成标题，简化用户操作
2. **模块化任务分配**：问题自动分配给相应模块的开发人员
3. **富文本编辑**：支持富文本编辑和图片上传，便于问题详细描述
4. **响应式设计**：适配各种设备屏幕尺寸
5. **国际化支持**：支持中英文双语界面

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 系统截图

[此处可添加系统截图]

## 开发团队

[开发团队信息]

## 许可证

© 2024 PADIA User Feedback Platform. All rights reserved.
