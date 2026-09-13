import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

print("=== Available Embedding Models ===")
for model in genai.list_models():
    if "embed" in model.name.lower():
        print(f"  Name: {model.name}")
        print(f"  Supported methods: {model.supported_generation_methods}")
        print(f"  Output token limit: {model.output_token_limit}")
        print()
