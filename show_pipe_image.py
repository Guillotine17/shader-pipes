import base64
import json
import sys


import io
import cv2
import base64 
import numpy as np
from PIL import Image
import time
shape = (64, 64)
# todo get imshow off thread
# todo write to video file
# todo save frames


# Take in base64 string and return PIL image
def stringToImage(base64_string, w, h):
    r = base64.b64decode(base64_string)
    img = Image.frombytes('RGBA', shape, r)
    # img.show()
    return toBGR(np.array(img))
    return toBGR(q)
    imgdata = base64.b64decode(base64_string)
    cv2.read
    return Image.open(imgdata)

# convert PIL Image to an RGB image( technically a numpy array ) that's compatible with opencv
def toBGR(image):
    return cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)
frames = 0
start_time = -1
while sys.stdin:
    b64_string = sys.stdin.readline()
    if frames == 0:
        if b64_string[0] == '{':
            print(b64_string)

            payload = json.loads(b64_string)
            print(payload)
            if payload.get('height'):
                shape = (payload["width"], payload["height"])
                continue
        start_time = time.time()
    if b64_string == '':
        # break
        print('no frame')
        break
    # print(b64_string)
    img = stringToImage(b64_string, shape[0], shape[1])
    h, w, channels = img.shape
    # print(f"{h}, {w}")
    cv2.imshow('Input', img)
    end_time = time.time()
    frames += 1
    print(f"fps: {frames/(end_time - start_time)}")
    c = cv2.waitKey(1)
    if c == 27:
        break
cv2.destroyAllWindows()

# print base64decoded