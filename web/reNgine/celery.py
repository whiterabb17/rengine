import os

import django
from celery import Celery
from celery.signals import setup_logging

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reNgine.settings')
django.setup()

# Celery app
app = Celery('reNgine')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@setup_logging.connect()
def config_loggers(*args, **kwargs):
    from logging.config import dictConfig
    dictConfig(app.conf['LOGGING'])


@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    # This can also be used for startup tasks
    pass


@app.on_after_configure.connect
def setup_startup_tasks(sender, **kwargs):
    pass


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


@app.on_after_finalize.connect
def setup_startup_sync(sender, **kwargs):
    """
    Trigger graph sync on startup. 
    Uses a Redis lock to ensure it only runs once across all workers/processes.
    """
    try:
        import redis
        from django.conf import settings
        
        # Connect to Redis using the configured broker URL
        r = redis.from_url(settings.CELERY_BROKER_URL)
        lock_key = "rengine:startup_graph_sync_lock"
        
        # Attempt to acquire a lock that expires in 1 hour
        # nx=True means it will only be set if it doesn't exist
        if r.set(lock_key, "locked", nx=True, ex=3600):
            from reNgine.tasks import sync_all_scans_to_graph
            sync_all_scans_to_graph.delay()
    except Exception as e:
        # Avoid crashing startup if Redis or task dispatch fails
        pass
