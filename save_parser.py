from dotdict import DotDict
from pathlib import Path
import pprint
import json


class SaveReader:
    saveBytes = bytearray()
    saveMap = []
    gameName = ''
    defaultIcon = ''

    def __init__(self, save=None, gameConfig=None):
        if isinstance(save, Path) or isinstance(save, str):
            self.loadFromSaveFile(save)
        elif isinstance(save, bytearray):
            self.setSaveBytes(save)
        if isinstance(gameConfig, Path) or isinstance(gameConfig, str):
            self.loadGameConfig(gameConfig)

    def setSaveBytes(self, saveBytes):
        self.saveBytes = saveBytes
        return self

    def getValue(self, address):
        return self.saveBytes[address]
    
    def loadFromSaveFile(self, filePath):
        self.filePath = filePath
        data = open(filePath,'rb')
        self.setSaveBytes(data.read())
        return self
    
    def loadGameConfig(self, filePath):
        data = json.loads(open(filePath,'r').read())
        gameName = data['gameName']
        saveStructure = data['saveStructure']
        for entry in saveStructure:
            entry["offset"] = int(entry["offset"], 16)  # Convert hex to integer
            entry["mask"] = int(entry["mask"], 2)  # Convert binary to integer
        self.saveMap = saveStructure
        self.gameName = gameName
        if 'defaultIcon' in data:
            self.defaultIcon = data['defaultIcon']
        return self
    
    def parseGame(self):
            save = []
            for rule in self.saveMap:
                rule = DotDict(rule)
                if 'icon' not in rule:
                    rule['icon'] = self.defaultIcon
                if rule.dataType == 'boolean':
                    data = self.getValue(rule.offset)&rule.mask
                    data = data > 0
                    rule['value'] = data
                    rule['gameName'] = self.gameName
                    save.append(rule)
            return save
    
    def compareSaveBytes(self, previousInstance):
        currentState = self.saveBytes
        previousState = previousInstance.saveBytes
        diff_mask = bytes(a ^ b for (a, b) in zip(currentState, previousState))
        i = 0
        changed_bytes = []
        for save_byte in diff_mask:
            if save_byte > 0:
                changed_bytes.append({
                    'address':hex(i),
                    'previous_value':bin(previousState[i]),
                    'current_value':bin(currentState[i])
                })
            i=i+1
        return changed_bytes
    
    def compareSaves(self, previousInstance):
        return  [a for a, b in zip(self.parseGame(), previousInstance.parseGame()) if a['value'] != b['value']]

if __name__ == "__main__":
    print(SaveReader(gameConfig='./mario64.config.json', save='./mario64/Super Mario 64 (U) [!]-20B854B2.eep').parseGame())
    