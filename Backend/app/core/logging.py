import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    logging_level = logging.DEBUG if settings.DEBUG else logging.INFO

    logging.basicConfig(
        level=logging_level,
        format="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d) - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Minimize verbose output from third-party libraries if desired, or keep info level
    if not settings.DEBUG:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    else:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
