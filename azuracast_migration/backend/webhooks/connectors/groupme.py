import requests
import time
from . import BaseConnector

class GroupMeConnector(BaseConnector):
    def send(self, config: dict, context: dict):
        bot_id = config.get('bot_id')
        if not bot_id:
            return
            
        text = config.get('text', 'Now playing on {{station.name}}: {{song.artist}} - {{song.title}}')
        
        # Variables replacement
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            if isinstance(value, str):
                text = text.replace(placeholder, value)
            elif isinstance(value, dict):
                for k, v in value.items():
                    nested_placeholder = f"{{{{{key}.{k}}}}}"
                    if isinstance(v, str):
                        text = text.replace(nested_placeholder, v)

        api_url = config.get('api', 'https://api.groupme.com/v3').rstrip('/')
        webhook_url = f"{api_url}/bots/post"
        
        # Split text into chunks of 1000 characters
        chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
        
        for chunk in chunks:
            data = {
                'bot_id': bot_id,
                'text': chunk,
            }
            
            try:
                requests.post(webhook_url, json=data, timeout=5)
                time.sleep(0.1)
            except requests.RequestException as e:
                print(f"GroupMe Webhook failed: {e}")
