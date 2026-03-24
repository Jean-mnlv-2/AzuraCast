import re

class BaseConnector:
    def send(self, config: dict, context: dict):
        raise NotImplementedError

    def replace_variables(self, text: str, context: dict) -> str:
        """
        Replaces {{ variable }} in text with values from context.
        Matches the behavior of AzuraCast's variable replacement.
        """
        if not text:
            return ""

        def replacer(match):
            var_name = match.group(2).strip().lower()
            return str(context.get(var_name, match.group(0)))

        return re.sub(r"\{\{(\s*)([a-zA-Z\d\-_.]+)(\s*)}}", replacer, text)
