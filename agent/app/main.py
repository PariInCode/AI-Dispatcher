from fastapi import FastAPI
from app.routers import health, parse , dispatch , replan

app = FastAPI(title="Dispatcher Agent")
app.include_router(health.router)
app.include_router(parse.router)
app.include_router(dispatch.router)
app.include_router(replan.router)