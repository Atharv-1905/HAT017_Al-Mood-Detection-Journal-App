from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from ai.config import Config

class ConversationalAssistant:
    def __init__(self):
        self.tokenizer = None
        self.model = None
        self.is_loaded = False

    def load_model(self):
        if not self.is_loaded:
            self.tokenizer = AutoTokenizer.from_pretrained(Config.CHATBOT_MODEL)
            self.model = AutoModelForCausalLM.from_pretrained(Config.CHATBOT_MODEL)
            self.is_loaded = True

    def generate_reply(self, text: str, history: list = None) -> str:
        self.load_model()
        new_user_input_ids = self.tokenizer.encode(text + self.tokenizer.eos_token, return_tensors='pt')
        
        # In a real app, we would concatenate history here
        bot_input_ids = new_user_input_ids
        
        chat_history_ids = self.model.generate(
            bot_input_ids, 
            max_length=1000, 
            pad_token_id=self.tokenizer.eos_token_id
        )
        
        reply = self.tokenizer.decode(
            chat_history_ids[:, bot_input_ids.shape[-1]:][0], 
            skip_special_tokens=True
        )
        return reply
