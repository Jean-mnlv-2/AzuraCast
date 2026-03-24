import requests
from .__init__ import BaseConnector

class DiscordConnector(BaseConnector):
    def send(self, config: dict, context: dict):
        webhook_url = config.get('webhook_url') or config.get('url')
        if not webhook_url:
            return
            
        content = self.replace_variables(config.get('content', "**Now Playing on {{ station }}**"), context)
        title = self.replace_variables(config.get('title', "{{ artist }} - {{ title }}"), context)
        description = self.replace_variables(config.get('description', "Album: {{ album }}"), context)
        
        color_hex = config.get('color', '3447003').lstrip('#')
        try:
            color = int(color_hex, 16)
        except ValueError:
            color = 3447003
            
        payload = {
            "content": content,
            "embeds": [{
                "title": title,
                "description": description,
                "color": color,
                "fields": []
            }]
        }
        
        if config.get('include_listening_stats', True):
            payload["embeds"][0]["fields"].append({
                "name": "Listeners",
                "value": str(context.get('listeners_total', '0')),
                "inline": True
            })

        try:
            requests.post(webhook_url, json=payload, timeout=5)
        except requests.RequestException as e:
            print(f"Discord Webhook failed: {e}")
