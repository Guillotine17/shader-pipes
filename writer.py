import sys
from time import sleep
import cv2
import json
import os
h = w = 64
from base64 import b64encode 
# TODO get reading from cap off thread
# sys.stdout.reconfigure(encoding='utf8')
def make_streams_binary():
    # sys.stdin = sys.stdin.detach()
    sys.stdout = sys.stdout.detach()
def send(input):
    sys.stdout.write(json.dumps(input)+'END_OF_MESSAGE')
    sys.stdout.flush()

def sendFrame(frame):
    sys.stdout.buffer.write(b64encode(frame) + b'END_OF_MESSAGE')
def sendShape(img):
    h, w, channels = img.shape
    send({'height': h, 'width': w})
def read_image_workaround(path):
    """OpenCV reads images as BGR, Pillow saves them as RGB. Work around
    this incompatibility to avoid colour inversions."""
    im_tmp = cv2.imread(path)
    # return im_tmp
    return cv2.cvtColor(im_tmp, cv2.COLOR_BGR2RGBA)

if sys.argv[1] == 'webcam':
    cap = cv2.VideoCapture(0)
    # 2560x720
    # 640x240
    cap.set(cv2.CAP_PROP_FPS, 60)
    # cap.set(cv2.CAP_PROP_FRAME_WIDTH, 2650)
    # cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    # Check if the webcam is opened correctly
    if not cap.isOpened():
        raise IOError("Cannot open webcam")

    shapeSent = False
    frameCount = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # frame = cv2.resize(frame, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
        if not shapeSent:
            sendShape(frame)
            shapeSent = True
        sendFrame(cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA))
        # cv2.imshow('Input', frame)
        # frameCount += 1
        # if frameCount > 2:
        #     break

    cap.release()
    cv2.destroyAllWindows()
else: 
    img = read_image_workaround(sys.argv[1])
    sendShape(img)
    sendFrame(img)


# make_streams_binary()
# sys.stdout.buffer.write(img)
# sys.stdout.buffer.write(b64encode(img))

# rows,cols = img.shape
# for i in range(1):
#     for j in range(1):
#         k = img[i,j]
#         sys.stdout.buffer.write(k)


