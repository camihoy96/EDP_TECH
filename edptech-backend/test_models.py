import google.generativeai as genai

genai.configure(api_key="AQ.Ab8RN6Ly1rVWD0aY57JNZBPQ0w4jqxr5E04g_5HU7iOQoQ3Lbg")

for model in genai.list_models():
    print(model.name)