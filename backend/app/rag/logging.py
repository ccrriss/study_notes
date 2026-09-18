import logging
import json

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    logger.addHandler(handler)

def generate_logging(event: str, request_id: str, query_length: int|None=None, total_ms:float|None=None, 
                     stage:str|None=None, error:Exception|None=None):
    log_data = {
        "event": event,
        "request_id": request_id
    }

    if query_length is not None:
        log_data["query_length"] = query_length
    if total_ms is not None:
        log_data["total_ms"] = total_ms
    if stage is not None:
        log_data["stage"] = stage
    if error is not None:
        log_data["error_type"] = type(error).__name__

    json_log_data = json.dumps(log_data)
    if error is not None:
        logger.error(json_log_data)
    else:
        logger.info(json_log_data)
    