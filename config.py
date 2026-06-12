import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Evaluator thresholds
EVAL_THRESHOLD = 0.75
MAX_RETRIES = 3
