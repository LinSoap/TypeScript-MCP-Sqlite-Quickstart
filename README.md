# 使用教程

## 项目简介
本项目是一个基于 TypeScript 和 SQLite 的快速入门案例，旨在帮助开发者快速构建和运行项目，了解MCP流程。配合博客食用更佳

## 环境要求
在开始之前，请确保您的系统已安装以下工具：
- [Node.js](https://nodejs.org/) (建议版本 16 或更高)
- [npm](https://www.npmjs.com/)
- SQLite 数据库

## 安装步骤

1. **克隆项目代码**
    ```bash
    git clone https://github.com/your-repo/TypeScript-MCP-Sqlite-Quickstart.git
    cd TypeScript-MCP-Sqlite-Quickstart
    ```

2. **安装依赖**
    使用 npm：
    ```bash
    npm install
    ```
    或使用 yarn：
    ```bash
    yarn install
    ```

3. **配置**
    确保 SQLite 数据文件已经成功拉取,在index.ts中，替换上你的apikey，以及你的问题。

4. **运行项目**
    或构建并运行：
    ```bash
    npm run build
    node ./build/index.js
    ```

## 项目结构
- `server/` MCP server目录
- `index.ts` MCP Client和大模型调用MCP


## 贡献
欢迎提交 Issue 或 Pull Request 来改进本项目！

## 许可证
本项目基于 [MIT 许可证](LICENSE) 开源。