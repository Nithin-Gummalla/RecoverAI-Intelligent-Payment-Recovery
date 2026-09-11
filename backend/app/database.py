import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env.local"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://recoverai:recoverai_local_pass@localhost:5432/recoverai_dev")
if not DATABASE_URL.startswith("postgres"):
    DATABASE_URL = "postgresql+asyncpg://recoverai:recoverai_local_pass@localhost:5432/recoverai_dev"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
