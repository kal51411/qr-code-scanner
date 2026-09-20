import cv2
from pyzbar.pyzbar import decode

cap=cv2.VideoCapture(0)
print("scanning press q to exit()")
while True:
  success,frame=cap.read()
  if not success:
    break

  for barcode in decode(frame):
    barcore_data=barcode.data.decode('utf-8')
    barcode_type=barcode.type
    print(f"barcode:{barcore_data} type:{barcode_type}")

  cv2.imshow('grocery Scanner',frame)

  if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()