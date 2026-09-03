from pydantic import StringConstraints
from typing import Annotated

QueryText = Annotated[str,
                      StringConstraints(strip_whitespace=True, min_length=10)]