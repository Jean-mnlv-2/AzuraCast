import requests
from . import BaseConnector

class MastodonConnector(BaseConnector):
    def send(self, config: dict, context: dict):
        instance_url = config.get('instance_url')
        access_token = config.get('access_token')
        
        if not all([instance_url, access_token]):
            return
            
        message = config.get('message', 'Now playing: {{song.artist}} - {{song.title}}')
        
        # Variables replacement
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            if isinstance(value, str):
                message = message.replace(placeholder, value)
            elif isinstance(value, dict):
                for k, v in value.items():
                    nested_placeholder = f"{{{{{key}.{k}}}}}"
                    if isinstance(v, str):
                        message = message.replace(nested_placeholder, v)

        instance_url = instance_url.rstrip('/')
        api_url = f"{instance_url}/api/v1/statuses"
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        data = {
            'status': message,
            'visibility': config.get('visibility', 'public'),
        }
        
        try:
            requests.post(api_url, headers=headers, json=data, timeout=5)
        except requests.RequestException as e:
            print(f"Mastodon Webhook failed: {e}")
