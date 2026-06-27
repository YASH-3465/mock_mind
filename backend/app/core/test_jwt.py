from app.core.jwt import create_access_token

token = create_access_token({"sub": "yash@gmail.com"})

print(token)