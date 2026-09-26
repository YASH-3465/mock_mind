from app.services.behavior.behavior_analysis_service import (
    analyze_interview_recording,
)


VIDEO_FILE = "recordings/session_18/question_1.webm"

TRANSCRIPT = """
"""


result = analyze_interview_recording(
    video_path=VIDEO_FILE,
    transcript=TRANSCRIPT,
)


print("\n========== BEHAVIOR ANALYSIS ==========\n")

print("Video:", result["video_path"])
print("File size:", result["file_size"], "bytes")

print("\n--- VOICE ANALYSIS ---")

for key, value in result["voice"].items():
    print(f"{key}: {value}")

print("\n--- POSTURE ANALYSIS ---")

for key, value in result["posture"].items():
    print(f"{key}: {value}")

print("\n=======================================\n")