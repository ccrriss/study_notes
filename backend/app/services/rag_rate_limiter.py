from redis.asyncio import Redis
from app.core.config import settings
from fastapi import HTTPException, status
from datetime import datetime, timezone
from redis.exceptions import WatchError, ConnectionError as RedisConnectionError, TimeoutError as RedisTimeoutError
import logging
import asyncio
import random

logger = logging.getLogger(__name__)

async def rag_rate_limiter(redis_client: Redis, client_ip: str, max_retries : int=3):
    try:
        now = datetime.now(timezone.utc)

        hour_bucket = now.strftime("%Y%m%d%H")
        day_bucket = now.strftime("%Y%m%d")

        ip_key = f"rag:limit:ip:{client_ip}:{hour_bucket}" 
        global_key = f"rag:limit:global:{day_bucket}" 
        
        async with redis_client.pipeline(transaction=True) as pipe:

            for i in range(max_retries):
                try: 
                    await pipe.watch(ip_key, global_key)

                    ip_count = int(await pipe.get(ip_key) or 0)
                    global_count = int(await pipe.get(global_key) or 0)

                    if ip_count >= settings.RAG_IP_HOURLY_LIMIT or global_count >= settings.RAG_GLOBAL_DAILY_LIMIT:
                        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "too many requests")

                    pipe.multi()

                    pipe.incr(ip_key)
                    pipe.expire(ip_key, time=3600, nx=True)
                    pipe.incr(global_key)
                    pipe.expire(global_key, time=86400, nx=True)

                    results = await pipe.execute()

                    return
                except WatchError:
                    if i == max_retries - 1:
                        break
                    
                    await asyncio.sleep(random.uniform(0.005, 0.3))
                    continue

        logger.warning("Rate limiter transaction failed after %d attempts", max_retries)
        
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "tried too many times")
    except (RedisConnectionError, RedisTimeoutError) as exc:
        logger.exception("Redis rate limiter unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rate limiter temporarily unavailable"
        ) from exc


    

