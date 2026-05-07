import json
from datetime import datetime
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

def patch_json_zoneinfo():
    original_default = json.JSONEncoder.default
    def new_default(self, obj):
        if isinstance(obj, ZoneInfo):
            return str(obj)
        return original_default(self, obj)
    json.JSONEncoder.default = new_default

patch_json_zoneinfo()
