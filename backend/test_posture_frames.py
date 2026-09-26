import cv2


VIDEO_FILE = "recordings/session_18/question_1.webm"

cap = cv2.VideoCapture(VIDEO_FILE)

if not cap.isOpened():
    raise RuntimeError("Could not open video.")

total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)

print("Total frames:", total_frames)
print("FPS:", fps)

frame_numbers = [
    0,
    total_frames // 4,
    total_frames // 2,
    (total_frames * 3) // 4,
    total_frames - 1,
]

for frame_number in frame_numbers:
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)

    success, frame = cap.read()

    if not success:
        print(f"Could not read frame {frame_number}")
        continue

    filename = f"debug_frame_{frame_number}.jpg"
    cv2.imwrite(filename, frame)

    print(f"Saved: {filename}")

cap.release()