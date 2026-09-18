from pathlib import Path

import cv2
import mediapipe as mp


VIDEO_FILE = "test_posture.mp4"
OUTPUT_FILE = "test_posture_landmarks.mp4"
MODEL_FILE = (
    Path(__file__).resolve().parent
    / "app"
    / "services"
    / "behavior"
    / "models"
    / "pose_landmarker_full.task"
)


def main():
    if not Path(VIDEO_FILE).exists():
        raise FileNotFoundError(
            f"Video not found: {VIDEO_FILE}"
        )

    if not MODEL_FILE.exists():
        raise FileNotFoundError(
            f"Pose model not found: {MODEL_FILE}"
        )

    BaseOptions = mp.tasks.BaseOptions
    VisionRunningMode = mp.tasks.vision.RunningMode
    PoseLandmarker = mp.tasks.vision.PoseLandmarker
    PoseLandmarkerOptions = (
        mp.tasks.vision.PoseLandmarkerOptions
    )

    options = PoseLandmarkerOptions(
        base_options=BaseOptions(
            model_asset_path=str(MODEL_FILE)
        ),
        running_mode=VisionRunningMode.IMAGE,
        num_poses=1,
    )

    cap = cv2.VideoCapture(VIDEO_FILE)

    if not cap.isOpened():
        raise RuntimeError(
            "Could not open input video."
        )

    width = int(
        cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    )
    height = int(
        cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    )
    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps <= 0:
        fps = 30.0

    fourcc = cv2.VideoWriter_fourcc(
        *"mp4v"
    )

    writer = cv2.VideoWriter(
        OUTPUT_FILE,
        fourcc,
        fps,
        (width, height),
    )

    with PoseLandmarker.create_from_options(
        options
    ) as landmarker:

        while True:
            success, frame = cap.read()

            if not success:
                break

            rgb_frame = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB,
            )

            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb_frame,
            )

            result = landmarker.detect(
                mp_image
            )

            if result.pose_landmarks:

                landmarks = result.pose_landmarks[0]

                # Draw landmark points
                for landmark in landmarks:

                    x = int(
                        landmark.x * width
                    )
                    y = int(
                        landmark.y * height
                    )

                    if (
                        0 <= x < width
                        and 0 <= y < height
                    ):
                        cv2.circle(
                            frame,
                            (x, y),
                            4,
                            (0, 255, 0),
                            -1,
                        )

                # Draw important connections
                connections = [
                    (11, 12),  # shoulders
                    (11, 13),  # left upper arm
                    (13, 15),  # left forearm
                    (12, 14),  # right upper arm
                    (14, 16),  # right forearm
                    (11, 23),  # left torso
                    (12, 24),  # right torso
                    (23, 24),  # hips
                    (7, 8),    # ears
                ]

                for start, end in connections:

                    p1 = landmarks[start]
                    p2 = landmarks[end]

                    x1 = int(p1.x * width)
                    y1 = int(p1.y * height)

                    x2 = int(p2.x * width)
                    y2 = int(p2.y * height)

                    cv2.line(
                        frame,
                        (x1, y1),
                        (x2, y2),
                        (0, 255, 0),
                        3,
                    )

            writer.write(frame)

    cap.release()
    writer.release()

    print(
        f"\nLandmark video created: {OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()