import asyncio
from datetime import datetime, timezone

from fastapi import HTTPException, status
from redis.asyncio import Redis

from app.core.config import settings
from app.services.rag_rate_limiter import rag_rate_limiter



async def main():
    now = datetime.now(timezone.utc)
    hour_bucket = now.strftime("%Y%m%d%H")
    day_bucket = now.strftime("%Y%m%d")

    global_key = f"rag:limit:global:{day_bucket}"

    client = Redis.from_url(
        "redis://localhost:6379/15",
        decode_responses=True
    )

    result_dict = {}

    try:
        ip_list = [f"192.0.2.{i}" for i in range(0, 20)]
        ip_key_list = [f"rag:limit:ip:{ip}:{hour_bucket}" for ip in ip_list]

        await client.delete(global_key, *ip_key_list)
    
        results = await asyncio.gather(
            *[rag_rate_limiter(redis_client=client, client_ip=ip, max_retries=10) for ip in ip_list],
            return_exceptions=True
        )

        for result in results:
            if isinstance(result, HTTPException):
                if result_dict.get("exception") is None:
                    result_dict["exception"] = 1
                else:
                    result_dict["exception"] += 1
            elif result is None:
                if result_dict.get("regular") is None:
                    result_dict["regular"] = 1
                else:
                    result_dict["regular"] += 1
            else:
                raise RuntimeError("unknown error")

        global_count = await client.get(global_key)
        print(f"Global count: {global_count}")
        
        print(f"{[item for item in list(result_dict.items())] }")

    finally:
        await client.aclose()

asyncio.run(main())
