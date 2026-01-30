# 智能聊天助手 (Smart Chat Assistant) 快速使用指南

这是一个基于 LangChain 和 OpenAI (兼容 API) 构建的智能聊天 Web 应用。它提供了一个美观的现代化界面，允许用户自定义 System Message 和 Human Message 与 AI 进行交互。

## ✨ 功能特点

*   **现代化 UI**: 采用 Glassmorphism (毛玻璃) 设计风格，带有动态背景动画。
*   **实时交互**: 快速响应的聊天界面。
*   **Markdown 支持**: AI 回复支持 Markdown 格式渲染。
*   **参数可调**: 可直接在界面上调整系统提示词(System Prompt)。

## 🛠️ 环境准备

确保你的系统已安装 Python 3.8 或更高版本。

### 1. 配置环境变量

项目依赖 `.env` 文件来获取 API 密钥和模型配置。请确保目录下存在 `.env` 文件，并包含以下内容：

```env
OPENAI_API_KEY="your_api_key_here"
OPENAI_BASE_URL="your_base_url_here"
MODEL_NAME="your_model_name"
```

### 2. 安装依赖

本项目使用 `uv` 进行依赖管理。在终端中运行以下命令初始化及安装依赖：

```bash
# 初始化环境并安装依赖 (如果尚未执行)
uv sync
```

或者直接运行以下命令添加依赖：

```bash
uv add fastapi uvicorn langchain langchain-openai python-dotenv pydantic
```

## 🚀 启动应用

在项目根目录下，使用 `uv` 运行后端服务器：

```bash
uv run uvicorn app:app --reload --host 0.0.0.0 --port 8010
```

*   `--reload`: 代码修改后自动重启 (开发模式)
*   `--host 0.0.0.0`: 允许从局域网访问
*   `--port 8010`: 运行端口

后台启动：

```bash
nohup uv run uvicorn app:app --host 0.0.0.0 --port 8010 > server.log 2>&1 &
```

## 💻 使用方法

1.  启动成功后，打开浏览器访问：**[http://localhost:8010](http://localhost:8010)**
2.  **System Message**: 在上方文本框输入 AI 的角色设定（例如："你是一个专业的 Python 程序员"）。
3.  **Human Message**: 在下方文本框输入你的问题。
4.  点击 **"发送消息"** 按钮或是按 `Ctrl + Enter` 发送。
5.  AI 的回复将显示在下方的卡片中。

## 📂 项目结构

*   `app.py`: FastAPI 后端主程序，处理 API 请求。
*   `static/`: 前端静态资源目录。
    *   `index.html`: 主页面结构。
    *   `style.css`: 样式文件 (毛玻璃效果、动画)。
    *   `script.js`: 前端交互逻辑。
*   `SQLagent.py`: 原始的命令行测试脚本 (参考用)。
*   `.env`: 配置文件 (不应上传到代码仓库)。
*   `prompt/`: 提示词目录。
    *   `prompt-example.md`: 示例提示词。

## ❓ 常见问题

**Q: 无法连接到服务器？**
A: 请检查终端中 `uvicorn` 是否正在运行且无报错。

**Q: AI 回复报错？**
A: 请检查 `.env` 文件中的 API Key 和 Base URL 是否正确，以及网络连接是否正常。
