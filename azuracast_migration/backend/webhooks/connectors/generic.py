import requests
from . import BaseConnector

class GenericConnector(BaseConnector):
    def send(self, config: dict, context: dict):
        url = config.get('webhook_url') or config.get('url')
        if not url:
            return
            
        timeout = float(config.get('timeout', 5.0))
        
        request_options = {
            'json': context,
            'timeout': timeout,
            'headers': {
                'Content-Type': 'application/json'
            }
        }
        
        # Add basic auth if configured
        username = config.get('basic_auth_username')
        password = config.get('basic_auth_password')
        if username and password:
            request_options['auth'] = (username, password)
            
        try:
            requests.post(url, **request_options)
        except requests.RequestException as e:
            print(f"Generic Webhook failed: {e}")
