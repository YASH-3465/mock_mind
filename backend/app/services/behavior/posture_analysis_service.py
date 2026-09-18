from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np


# --------------------------------------------------
# MODEL PATH
# --------------------------------------------------

MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "pose_landmarker_full.task"
)


# --------------------------------------------------
# LANDMARK INDEXES
# --------------------------------------------------

LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12

LEFT_EAR = 7
RIGHT_EAR = 8

LEFT_HIP = 23
RIGHT_HIP = 24


# --------------------------------------------------
# POSE LANDMARKER SETUP
# --------------------------------------------------

def create_pose_landmarker():
    """
    Create a MediaPipe Pose Landmarker instance.
    """

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Pose model not found: {MODEL_PATH}"
        )

    BaseOptions = mp.tasks.BaseOptions
    VisionRunningMode = mp.tasks.vision.RunningMode
    PoseLandmarker = mp.tasks.vision.PoseLandmarker
    PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions

    options = PoseLandmarkerOptions(
        base_options=BaseOptions(
            model_asset_path=str(MODEL_PATH)
        ),
        running_mode=VisionRunningMode.IMAGE,
        num_poses=1,
    )

    return PoseLandmarker.create_from_options(
        options
    )


# --------------------------------------------------
# LANDMARK HELPERS
# --------------------------------------------------

def get_landmark(landmarks, index: int):
    """
    Safely return a landmark by index.
    """

    if index >= len(landmarks):
        return None

    return landmarks[index]


def get_point(landmarks, index: int):
    """
    Return the normalized x/y position of a landmark.
    """

    landmark = get_landmark(
        landmarks,
        index,
    )

    if landmark is None:
        return None

    return np.array(
        [landmark.x, landmark.y],
        dtype=float,
    )


def calculate_distance(point_a, point_b):
    """
    Calculate 2D Euclidean distance.
    """

    if point_a is None or point_b is None:
        return 0.0

    return float(
        np.linalg.norm(
            point_a - point_b
        )
    )


# --------------------------------------------------
# SHOULDER ALIGNMENT
# --------------------------------------------------

def calculate_shoulder_alignment(landmarks):
    """
    Measure the vertical difference between shoulders.

    Smaller values mean the shoulders are more level.
    """

    left = get_landmark(
        landmarks,
        LEFT_SHOULDER,
    )

    right = get_landmark(
        landmarks,
        RIGHT_SHOULDER,
    )

    if left is None or right is None:
        return 0.0

    return round(
        abs(left.y - right.y),
        4,
    )


# --------------------------------------------------
# HEAD POSITION
# --------------------------------------------------

def calculate_head_position(landmarks):
    """
    Estimate head position relative to shoulder center.
    """

    left_ear = get_landmark(
        landmarks,
        LEFT_EAR,
    )

    right_ear = get_landmark(
        landmarks,
        RIGHT_EAR,
    )

    left_shoulder = get_landmark(
        landmarks,
        LEFT_SHOULDER,
    )

    right_shoulder = get_landmark(
        landmarks,
        RIGHT_SHOULDER,
    )

    if (
        left_ear is None
        or right_ear is None
        or left_shoulder is None
        or right_shoulder is None
    ):
        return {
            "head_x": 0.0,
            "head_y": 0.0,
        }

    head_x = (
        left_ear.x
        + right_ear.x
    ) / 2

    head_y = (
        left_ear.y
        + right_ear.y
    ) / 2

    shoulder_x = (
        left_shoulder.x
        + right_shoulder.x
    ) / 2

    shoulder_y = (
        left_shoulder.y
        + right_shoulder.y
    ) / 2

    return {
        "head_x": round(
            head_x - shoulder_x,
            4,
        ),
        "head_y": round(
            head_y - shoulder_y,
            4,
        ),
    }


# --------------------------------------------------
# TORSO POSITION
# --------------------------------------------------

def calculate_torso_position(landmarks):
    """
    Estimate torso center using shoulders and hips.
    """

    left_shoulder = get_landmark(
        landmarks,
        LEFT_SHOULDER,
    )

    right_shoulder = get_landmark(
        landmarks,
        RIGHT_SHOULDER,
    )

    left_hip = get_landmark(
        landmarks,
        LEFT_HIP,
    )

    right_hip = get_landmark(
        landmarks,
        RIGHT_HIP,
    )

    if any(
        point is None
        for point in [
            left_shoulder,
            right_shoulder,
            left_hip,
            right_hip,
        ]
    ):
        return {
            "torso_x": 0.0,
            "torso_y": 0.0,
        }

    shoulder_center_x = (
        left_shoulder.x
        + right_shoulder.x
    ) / 2

    shoulder_center_y = (
        left_shoulder.y
        + right_shoulder.y
    ) / 2

    hip_center_x = (
        left_hip.x
        + right_hip.x
    ) / 2

    hip_center_y = (
        left_hip.y
        + right_hip.y
    ) / 2

    torso_x = (
        shoulder_center_x
        + hip_center_x
    ) / 2

    torso_y = (
        shoulder_center_y
        + hip_center_y
    ) / 2

    return {
        "torso_x": round(
            torso_x,
            4,
        ),
        "torso_y": round(
            torso_y,
            4,
        ),
    }


# --------------------------------------------------
# FRAME ANALYSIS
# --------------------------------------------------

def analyze_frame(frame, landmarker):
    """
    Run pose detection on one video frame.
    """

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

    if not result.pose_landmarks:
        return None

    landmarks = result.pose_landmarks[0]

    shoulder_alignment = (
        calculate_shoulder_alignment(
            landmarks
        )
    )

    head_position = (
        calculate_head_position(
            landmarks
        )
    )

    torso_position = (
        calculate_torso_position(
            landmarks
        )
    )

    return {
    "shoulder_alignment": shoulder_alignment,
    "head_position": head_position,
    "torso_position": torso_position,

    "left_shoulder": {
        "x": landmarks[LEFT_SHOULDER].x,
        "y": landmarks[LEFT_SHOULDER].y,
    },

    "right_shoulder": {
        "x": landmarks[RIGHT_SHOULDER].x,
        "y": landmarks[RIGHT_SHOULDER].y,
    },
}


# --------------------------------------------------
# MOVEMENT ANALYSIS
# --------------------------------------------------

def calculate_movement_metrics(frame_results):
    """
    Calculate normalized frame-to-frame movement of the
    head, shoulders, and torso.

    Movement is normalized using the shoulder width so
    that the measurements are less dependent on how
    close the person is to the camera.

    These values describe observable movement only.
    They are not confidence measurements.
    """

    if len(frame_results) < 2:
        return {
            "head_movement": 0.0,
            "shoulder_movement": 0.0,
            "torso_movement": 0.0,
            "overall_movement": 0.0,
            "posture_stability": "insufficient_data",
        }

    head_movements = []
    shoulder_movements = []
    torso_movements = []

    previous = frame_results[0]

    for current in frame_results[1:]:

        # ------------------------------------------
        # HEAD MOVEMENT
        # ------------------------------------------

        previous_head = np.array([
            previous["head_position"]["head_x"],
            previous["head_position"]["head_y"],
        ])

        current_head = np.array([
            current["head_position"]["head_x"],
            current["head_position"]["head_y"],
        ])

        head_movement = calculate_distance(
            previous_head,
            current_head,
        )

        # ------------------------------------------
        # ACTUAL SHOULDER POSITIONS
        # ------------------------------------------

        previous_left_shoulder = np.array([
            previous["left_shoulder"]["x"],
            previous["left_shoulder"]["y"],
        ])

        current_left_shoulder = np.array([
            current["left_shoulder"]["x"],
            current["left_shoulder"]["y"],
        ])

        previous_right_shoulder = np.array([
            previous["right_shoulder"]["x"],
            previous["right_shoulder"]["y"],
        ])

        current_right_shoulder = np.array([
            current["right_shoulder"]["x"],
            current["right_shoulder"]["y"],
        ])

        left_shoulder_movement = calculate_distance(
            previous_left_shoulder,
            current_left_shoulder,
        )

        right_shoulder_movement = calculate_distance(
            previous_right_shoulder,
            current_right_shoulder,
        )

        shoulder_movement = (
            left_shoulder_movement
            + right_shoulder_movement
        ) / 2

        # ------------------------------------------
        # TORSO MOVEMENT
        # ------------------------------------------

        previous_torso = np.array([
            previous["torso_position"]["torso_x"],
            previous["torso_position"]["torso_y"],
        ])

        current_torso = np.array([
            current["torso_position"]["torso_x"],
            current["torso_position"]["torso_y"],
        ])

        torso_movement = calculate_distance(
            previous_torso,
            current_torso,
        )

        # ------------------------------------------
        # SHOULDER WIDTH
        # ------------------------------------------

        current_shoulder_width = calculate_distance(
            current_left_shoulder,
            current_right_shoulder,
        )

        previous_shoulder_width = calculate_distance(
            previous_left_shoulder,
            previous_right_shoulder,
        )

        average_shoulder_width = (
            current_shoulder_width
            + previous_shoulder_width
        ) / 2

        # ------------------------------------------
        # NORMALIZATION
        # ------------------------------------------

        if average_shoulder_width > 0.001:
            head_movement /= average_shoulder_width
            shoulder_movement /= average_shoulder_width
            torso_movement /= average_shoulder_width

        head_movements.append(head_movement)
        shoulder_movements.append(shoulder_movement)
        torso_movements.append(torso_movement)

        previous = current

    # ----------------------------------------------
    # AVERAGE NORMALIZED MOVEMENT
    # ----------------------------------------------

    head_movement = float(
        np.mean(head_movements)
    )

    shoulder_movement = float(
        np.mean(shoulder_movements)
    )

    torso_movement = float(
        np.mean(torso_movements)
    )

    # ----------------------------------------------
    # WEIGHTED OVERALL MOVEMENT
    # ----------------------------------------------
    #
    # Head movement is slightly more important for
    # upper-body interview behavior.
    #
    # These are movement weights, NOT confidence
    # weights.
    # ----------------------------------------------

    overall_movement = (
        head_movement * 0.40
        + shoulder_movement * 0.30
        + torso_movement * 0.30
    )

    # ----------------------------------------------
    # INITIAL STABILITY CATEGORIES
    # ----------------------------------------------

    if overall_movement < 0.03:
        posture_stability = "stable"

    elif overall_movement < 0.08:
        posture_stability = "moderate_movement"

    else:
        posture_stability = "high_movement"

    return {
        "head_movement": round(
            head_movement,
            5,
        ),
        "shoulder_movement": round(
            shoulder_movement,
            5,
        ),
        "torso_movement": round(
            torso_movement,
            5,
        ),
        "overall_movement": round(
            overall_movement,
            5,
        ),
        "posture_stability": posture_stability,
    }

# --------------------------------------------------
# VIDEO ANALYSIS
# --------------------------------------------------

def analyze_posture(
    video_path: str,
    sample_every_n_frames: int = 10,
):
    """
    Analyze posture and upper-body movement
    from a recorded video.

    These measurements describe observable
    body-position and movement characteristics.

    They are NOT direct measurements of
    confidence, emotions, intelligence,
    or mental state.
    """

    path = Path(video_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Video file not found: {video_path}"
        )

    cap = cv2.VideoCapture(
        str(path)
    )

    if not cap.isOpened():
        raise RuntimeError(
            f"Could not open video: {video_path}"
        )

    frame_count = 0
    analyzed_frames = []

    with create_pose_landmarker() as landmarker:

        while True:

            success, frame = cap.read()

            if not success:
                break

            frame_count += 1

            if (
                frame_count
                % sample_every_n_frames
                != 0
            ):
                continue

            frame_result = analyze_frame(
                frame,
                landmarker,
            )

            if frame_result is not None:
                analyzed_frames.append(
                    frame_result
                )

    cap.release()

    if not analyzed_frames:
        return {
            "video_path": str(path),
            "total_frames": frame_count,
            "analyzed_frames": 0,
            "pose_detection_rate": 0.0,
            "average_shoulder_alignment": 0.0,
            "average_head_x": 0.0,
            "average_head_y": 0.0,
            "average_torso_x": 0.0,
            "average_torso_y": 0.0,
            "head_movement": 0.0,
            "shoulder_movement": 0.0,
            "torso_movement": 0.0,
            "overall_movement": 0.0,
        }

    # ----------------------------------------------
    # EXISTING POSITION METRICS
    # ----------------------------------------------

    shoulder_values = [
        item["shoulder_alignment"]
        for item in analyzed_frames
    ]

    head_x_values = [
        item["head_position"]["head_x"]
        for item in analyzed_frames
    ]

    head_y_values = [
        item["head_position"]["head_y"]
        for item in analyzed_frames
    ]

    torso_x_values = [
        item["torso_position"]["torso_x"]
        for item in analyzed_frames
    ]

    torso_y_values = [
        item["torso_position"]["torso_y"]
        for item in analyzed_frames
    ]

    # ----------------------------------------------
    # NEW MOVEMENT METRICS
    # ----------------------------------------------

    movement_metrics = calculate_movement_metrics(
        analyzed_frames
    )

    # ----------------------------------------------
    # DETECTION RATE
    # ----------------------------------------------

    expected_samples = max(
        1,
        frame_count
        // sample_every_n_frames,
    )

    detection_rate = (
        len(analyzed_frames)
        / expected_samples
    )

    return {
        "video_path": str(path),
        "total_frames": frame_count,
        "analyzed_frames": len(
            analyzed_frames
        ),
        "pose_detection_rate": round(
            min(1.0, detection_rate),
            3,
        ),

        "average_shoulder_alignment": round(
            float(np.mean(shoulder_values)),
            4,
        ),

        "average_head_x": round(
            float(np.mean(head_x_values)),
            4,
        ),

        "average_head_y": round(
            float(np.mean(head_y_values)),
            4,
        ),

        "average_torso_x": round(
            float(np.mean(torso_x_values)),
            4,
        ),

        "average_torso_y": round(
            float(np.mean(torso_y_values)),
            4,
        ),

        "head_movement": movement_metrics[
            "head_movement"
        ],

        "shoulder_movement": movement_metrics[
            "shoulder_movement"
        ],

        "torso_movement": movement_metrics[
            "torso_movement"
        ],

        "overall_movement": movement_metrics[
            "overall_movement"
        ],

        "posture_stability": movement_metrics[
            "posture_stability"
        ],
    }