import requests
from .__init__ import BaseConnector

class TelegramConnector(BaseConnector):
    def send(self, config: dict, context: dict):
        bot_token = config.get('bot_token')
        chat_id = config.get('chat_id')
        if not bot_token or not chat_id:
            return
            
        default_message = (
            "📻 **Now Playing on {{ station }}**\n"
            "🎵 {{ artist }} - {{ title }}\n"
            "💿 Album: {{ album }}"
        )
        message = self.replace_variables(config.get('text', default_message), context)
        
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": config.get('parse_mode', 'Markdown')
        }
        
        try:
            requests.post(url, json=payload, timeout=5)
        except requests.RequestException as e:
            print(f"Telegram Webhook failed: {e}")
