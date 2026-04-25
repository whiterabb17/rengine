import os
import django
import yaml

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reNgine.settings')
django.setup()

from scanEngine.models import EngineType

engines = EngineType.objects.all()
for engine in engines:
    print(f"Engine: {engine.engine_name}")
    try:
        config = yaml.safe_load(engine.yaml_configuration)
        print(f"  Config Keys: {list(config.keys()) if config else 'None'}")
        print(f"  Tasks: {engine.tasks}")
    except Exception as e:
        print(f"  Error parsing YAML: {e}")
    print("-" * 20)
