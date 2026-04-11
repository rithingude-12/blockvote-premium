import json
import os
from web3 import Web3
from ..config import settings

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.GANACHE_URL))
        self.is_connected = self.w3.is_connected()
        self.default_account = self.w3.eth.accounts[0] if self.is_connected else None
        
        # Load ABIs - Ensure accurate paths relative to execution
        self.abis = {}
        contracts_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "contracts", "build", "contracts")
        
        # Try loading ABIs if they exist
        for cname in ["ElectionController", "VoterRegistry", "VotingBooth", "ResultsTallier"]:
            path = os.path.join(contracts_dir, f"{cname}.json")
            if os.path.exists(path):
                with open(path, "r") as f:
                    self.abis[cname] = json.load(f)["abi"]
            else:
                self.abis[cname] = None
                
    def get_contract(self, name: str, address: str):
        if not self.abis.get(name):
            raise Exception(f"ABI for {name} not found")
        return self.w3.eth.contract(address=address, abi=self.abis[name])

    def build_and_send_tx(self, contract_func, from_address=None):
        from_acc = from_address or self.default_account
        tx = contract_func.build_transaction({
            'from': from_acc,
            'nonce': self.w3.eth.get_transaction_count(from_acc)
        })
        # Note: In a real app we'd sign it with private key. 
        # With Ganache in dev, HTTP provider unlocks accounts.
        tx_hash = self.w3.eth.send_transaction(tx)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt

blockchain_service = BlockchainService()
