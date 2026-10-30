from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from flask.json.provider import DefaultJSONProvider


class ApiJSONProvider(DefaultJSONProvider):
    """ISO dates, numeric decimals and string UUIDs (matches the frontend's expectations)."""

    @staticmethod
    def default(o):
        if isinstance(o, (datetime, date)):
            return o.isoformat()
        if isinstance(o, Decimal):
            return int(o) if o == o.to_integral_value() else float(o)
        if isinstance(o, UUID):
            return str(o)
        return DefaultJSONProvider.default(o)

    sort_keys = False
