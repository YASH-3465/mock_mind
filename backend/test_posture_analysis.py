from app.services.behavior.posture_analysis_service import analyze_posture


VIDEO_FILE = "test_posture.mp4"


result = analyze_posture(
    video_path=VIDEO_FILE,
    sample_every_n_frames=10,
)


print("\n========== POSTURE ANALYSIS ==========\n")

for key, value in result.items():
    print(f"{key}: {value}")

print("\n======================================\n")