from app.services.behavior.voice_analysis_service import analyze_voice


AUDIO_FILE = "test_audio.mp3"

TRANSCRIPT = """
Hello, my name is Yashwanth. Um, I am a computer science student.
I have worked on several projects and I really like building AI systems.
Basically, I enjoy solving problems and learning new technologies.
"""


result = analyze_voice(
    audio_path=AUDIO_FILE,
    transcript=TRANSCRIPT,
)


print("\n========== VOICE ANALYSIS ==========\n")

for key, value in result.items():
    print(f"{key}: {value}")

print("\n====================================\n")