import os
import asyncio
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

async def test_stream():
    llm = ChatOpenAI(
        model="google/gemini-2.5-flash",
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        temperature=0.2,
        max_tokens=8192,
        streaming=True,
        max_retries=0
    )
    
    messages = [
        SystemMessage(content="You are a helpful assistant."),
        HumanMessage(content="Write a 2-sentence story about a robot.")
    ]
    
    print("Starting stream...")
    try:
        async for chunk in llm.astream(messages):
            print(f"CHUNK: {repr(chunk.content)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_stream())
