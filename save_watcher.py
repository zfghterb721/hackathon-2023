import sys
import time
import logging
from pathlib import Path
from haikunator import Haikunator
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler
from save_parser import SaveReader
import json
import requests
import os
from dotenv import load_dotenv
load_dotenv()

SERVER_URL = os.environ['BURRITO_SERVER_URL']
APP_SECRET = os.environ['BURRITO_SERVER_SECRET']
BYTE_CHANGE_LOGGING = True
FILE_TO_WATCH = './mario64/Super Mario 64 (U) [!]-20B854B2.eep'
FILE_TO_WATCH = Path(FILE_TO_WATCH)
#From environment variable

def getSystemId():
    file_name = "neato_burrito.id"
    
    if os.path.exists(file_name):
        with open(file_name, "r") as f:
            return f.read().strip()
    else:
        haikunator = Haikunator()
        new_id = haikunator.haikunate(delimiter='-')
        with open(file_name, "w") as f:
            f.write(new_id)
        return new_id

def saveChangeHandler(fileModifiedEvent):
    global previousState
    currentState = SaveReader(gameConfig='./mario64.config.json', save=fileModifiedEvent.src_path)
    diff = currentState.compareSaves(previousState)
    if(len(diff)):
        logging.info(json.dumps(diff))
        data = requests.post(SERVER_URL,json=diff, headers={
            'x-neato-burrito-secret': APP_SECRET,
            'x-neato-burrito-system-id': getSystemId()
        })
        logging.info(data)
    if(BYTE_CHANGE_LOGGING):
        byteDiff = currentState.compareSaveBytes(previousState)
        if(len(byteDiff)):
            logging.info(byteDiff)
    previousState = currentState

if __name__ == "__main__":
    previousState = SaveReader(gameConfig='./mario64.config.json', save=FILE_TO_WATCH)
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')
    path = FILE_TO_WATCH.parent
    logging.info(f'start watching directory {str(path.stem)!r} for changes to file {str(FILE_TO_WATCH.name)!r}')
    event_handler = PatternMatchingEventHandler(
        patterns=[FILE_TO_WATCH.name]
    )
    event_handler.on_modified = saveChangeHandler
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    finally:
        observer.stop()
        observer.join()