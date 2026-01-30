import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage, HumanMessage
import dotenv

# 加载环境变量
dotenv.load_dotenv()

app = FastAPI(title="聊天助手 API")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化模型
model = init_chat_model(
    model=os.getenv("MODEL_NAME"),
    model_provider="openai",
    temperature=0.5,
    base_url=os.getenv("OPENAI_BASE_URL"),
    extra_body={
        "chat_template_kwargs": {"enable_thinking": False},
        "enable_thinking": False,
    },
)


class ChatRequest(BaseModel):
    system_message: str
    human_message: str


class ChatResponse(BaseModel):
    response: str
    success: bool
    error: str = None


class ConfigResponse(BaseModel):
    model_name: str


@app.get("/api/config", response_model=ConfigResponse)
async def get_config():
    """
    获取应用配置
    """
    return ConfigResponse(model_name=os.getenv("MODEL_NAME", "Unknown Model"))


# 挂载静态文件目录 (必须在定义路由之前)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    处理聊天请求
    """
    try:
        messages = [
            SystemMessage(content=request.system_message),
            HumanMessage(content=request.human_message),
        ]

        result = model.invoke(messages)

        return ChatResponse(response=result.content, success=True)
    except Exception as e:
        return ChatResponse(response="", success=False, error=str(e))


# 处理浏览器扩展产生的请求，避免404错误
@app.get("/xpack_static/{path:path}")
async def xpack_static_handler(path: str):
    """
    静默处理浏览器扩展的请求
    """
    return {}


@app.get("/", response_class=HTMLResponse)
async def read_root():
    """
    返回前端页面
    """
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return index_path.read_text(encoding="utf-8")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8010)
