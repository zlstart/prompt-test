import os

from langchain.chat_models import init_chat_model
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
import dotenv
from openai import max_retries


dotenv.load_dotenv()
# 1、获取大模型的实例
model = init_chat_model(
    model=os.getenv("MODEL_NAME"),
    model_provider="openai",
    temperature = 0.5,
    base_url=os.getenv("OPENAI_BASE_URL"),
    extra_body={
        # "chat_template_kwargs": {"enable_thinking": False}  # 关键参数
        "chat_template_kwargs": {"enable_thinking": False}  # 关键参数 vllm这样设置就可以
        ,"enable_thinking": False # 使用百炼模型时，需要这样设置。
    }
)



# 2、构造一个提示词模板或者提示词
messages = [
    SystemMessage(content="你是一个智能助手，可以帮助用户解决问题,你的名字叫做小智"),
    HumanMessage(content="你是谁")
]
# 3、调用model的Invoke方法，获取模型的结果

print(model.invoke(messages).content)