from pathlib import Path
import re

import librosa
import numpy as np


# --------------------------------------------------
# FILLER WORDS
# --------------------------------------------------

FILLER_WORDS = {
    "um",
    "uh",
    "hmm",
    "like",
    "actually",
    "basically",
    "literally",
    "you know",
    "i mean",
    "sort of",
    "kind of",
}


# --------------------------------------------------
# LOAD AUDIO
# --------------------------------------------------

def load_audio(audio_path: str):
    """
    Load an audio file safely.

    MP3 files are decoded through FFmpeg first because
    librosa/soundfile can fail on some MP3 files.
    """

    path = Path(audio_path)

    if not path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    # Use FFmpeg through pydub for reliable MP3 decoding
    from pydub import AudioSegment

    audio_segment = AudioSegment.from_file(str(path))

    # Convert to mono
    audio_segment = audio_segment.set_channels(1)

    # Get sample rate
    sample_rate = audio_segment.frame_rate

    # Convert raw PCM samples to numpy array
    samples = np.array(audio_segment.get_array_of_samples())

    # Normalize integer audio to floating point [-1, 1]
    if audio_segment.sample_width == 1:
        audio = samples.astype(np.float32) / 128.0
    elif audio_segment.sample_width == 2:
        audio = samples.astype(np.float32) / 32768.0
    elif audio_segment.sample_width == 4:
        audio = samples.astype(np.float32) / 2147483648.0
    else:
        audio = samples.astype(np.float32)

    return audio, sample_rate
# --------------------------------------------------
# AUDIO DURATION
# --------------------------------------------------

def calculate_duration(
    audio: np.ndarray,
    sample_rate: int,
) -> float:
    """
    Calculate total audio duration in seconds.
    """

    if sample_rate <= 0:
        return 0.0

    return float(len(audio) / sample_rate)


# --------------------------------------------------
# SPEECH / SILENCE DETECTION
# --------------------------------------------------

def detect_speech_segments(
    audio: np.ndarray,
    sample_rate: int,
):
    """
    Detect regions containing non-silent audio.

    Returns:
        list of (start_sample, end_sample)
    """

    if len(audio) == 0:
        return []

    intervals = librosa.effects.split(
        audio,
        top_db=30,
        frame_length=2048,
        hop_length=512,
    )

    return intervals.tolist()


# --------------------------------------------------
# SILENCE ANALYSIS
# --------------------------------------------------

def calculate_silence_metrics(
    audio: np.ndarray,
    sample_rate: int,
):
    """
    Calculate speaking time, silence time and
    silence ratio.
    """

    total_duration = calculate_duration(
        audio,
        sample_rate,
    )

    if total_duration <= 0:
        return {
            "speaking_time": 0.0,
            "silence_time": 0.0,
            "silence_ratio": 0.0,
        }

    segments = detect_speech_segments(
        audio,
        sample_rate,
    )

    speaking_samples = sum(
        end - start
        for start, end in segments
    )

    speaking_time = speaking_samples / sample_rate

    silence_time = max(
        0.0,
        total_duration - speaking_time,
    )

    silence_ratio = (
        silence_time / total_duration
        if total_duration > 0
        else 0.0
    )

    return {
        "speaking_time": round(
            speaking_time,
            2,
        ),
        "silence_time": round(
            silence_time,
            2,
        ),
        "silence_ratio": round(
            silence_ratio,
            3,
        ),
    }


# --------------------------------------------------
# PAUSE ANALYSIS
# --------------------------------------------------

def calculate_pause_metrics(speech_segments):
    """
    Calculate conversational pauses between detected speech segments.

    Short pause:
        >= 0.15 seconds

    Meaningful pause:
        >= 0.40 seconds
    """

    if len(speech_segments) < 2:
        return {
            "pause_count": 0,
            "short_pause_count": 0,
            "meaningful_pause_count": 0,
            "average_pause": 0.0,
            "longest_pause": 0.0,
        }

    pauses = []

    for i in range(1, len(speech_segments)):
        previous_end = speech_segments[i - 1][1]
        current_start = speech_segments[i][0]

        pause_duration = current_start - previous_end

        if pause_duration >= 0.15:
            pauses.append(pause_duration)

    if not pauses:
        return {
            "pause_count": 0,
            "short_pause_count": 0,
            "meaningful_pause_count": 0,
            "average_pause": 0.0,
            "longest_pause": 0.0,
        }

    meaningful_pauses = [
        pause for pause in pauses
        if pause >= 0.40
    ]

    return {
        "pause_count": len(pauses),
        "short_pause_count": len(pauses),
        "meaningful_pause_count": len(meaningful_pauses),
        "average_pause": round(
            float(np.mean(pauses)),
            2,
        ),
        "longest_pause": round(
            float(max(pauses)),
            2,
        ),
    }
# --------------------------------------------------
# AUDIO ENERGY
# --------------------------------------------------

def calculate_audio_energy(
    audio: np.ndarray,
):
    """
    Calculate basic RMS energy of the voice signal.
    """

    if len(audio) == 0:
        return {
            "average_energy": 0.0,
            "energy_variation": 0.0,
        }

    rms = librosa.feature.rms(
        y=audio
    )[0]

    average_energy = float(
        np.mean(rms)
    )

    energy_variation = float(
        np.std(rms)
    )

    return {
        "average_energy": round(
            average_energy,
            4,
        ),
        "energy_variation": round(
            energy_variation,
            4,
        ),
    }


# --------------------------------------------------
# FILLER WORD ANALYSIS
# --------------------------------------------------

def analyze_fillers(
    transcript: str | None,
):
    """
    Count common filler words from a transcript.
    """

    if not transcript:
        return {
            "filler_count": 0,
            "filler_words": {},
        }

    text = transcript.lower()

    filler_counts = {}

    for filler in FILLER_WORDS:
        if " " in filler:
            pattern = (
                r"\b"
                + re.escape(filler)
                + r"\b"
            )
        else:
            pattern = (
                r"\b"
                + re.escape(filler)
                + r"\b"
            )

        matches = re.findall(
            pattern,
            text,
        )

        if matches:
            filler_counts[filler] = len(
                matches
            )

    total_fillers = sum(
        filler_counts.values()
    )

    return {
        "filler_count": total_fillers,
        "filler_words": filler_counts,
    }


# --------------------------------------------------
# SPEAKING RATE
# --------------------------------------------------

def calculate_speaking_rate(
    transcript: str | None,
    speaking_time: float,
):
    """
    Calculate approximate words per minute.

    This is based on the transcript and detected
    speaking time, not total recording duration.
    """

    if not transcript or speaking_time <= 0:
        return {
            "word_count": 0,
            "words_per_minute": 0.0,
        }

    words = re.findall(
        r"\b[\w']+\b",
        transcript,
    )

    word_count = len(words)

    speaking_minutes = (
        speaking_time / 60
    )

    if speaking_minutes <= 0:
        return {
            "word_count": word_count,
            "words_per_minute": 0.0,
        }

    words_per_minute = (
        word_count / speaking_minutes
    )

    return {
        "word_count": word_count,
        "words_per_minute": round(
            words_per_minute,
            2,
        ),
    }


# --------------------------------------------------
# SPEAKING RATE CLASSIFICATION
# --------------------------------------------------

def classify_speaking_rate(
    words_per_minute: float,
):
    """
    Classify speaking rate using simple heuristic ranges.

    These categories describe observable speaking speed.
    They are not a measure of confidence, intelligence,
    or communication ability.
    """

    if words_per_minute <= 0:
        return "unknown"

    if words_per_minute < 100:
        return "slow"

    if words_per_minute < 160:
        return "moderate"

    if words_per_minute <= 200:
        return "normal_fast"

    return "fast"

# --------------------------------------------------
# COMPLETE VOICE ANALYSIS
# --------------------------------------------------

def analyze_voice(
    audio_path: str,
    transcript: str | None = None,
):
    """
    Run the complete voice-analysis pipeline.

    The current pipeline measures observable
    acoustic and speech-pattern features.

    It does NOT claim to directly measure a
    person's internal confidence or emotions.
    """

    audio, sample_rate = load_audio(
        audio_path
    )

    duration = calculate_duration(
        audio,
        sample_rate,
    )

    silence_metrics = (
        calculate_silence_metrics(
            audio,
            sample_rate,
        )
    )


    speech_segments = detect_speech_segments(
            audio,
            sample_rate,
            )

    pause_metrics = calculate_pause_metrics(
        [
            (
                start / sample_rate,
                end / sample_rate,
            )
            for start, end in speech_segments
        ]
    )

    energy_metrics = (
        calculate_audio_energy(
            audio
        )
    )

    speaking_rate = calculate_speaking_rate(
        transcript,
        silence_metrics["speaking_time"],
    )

    speaking_rate_category = classify_speaking_rate(
        speaking_rate["words_per_minute"]
    )

    filler_metrics = analyze_fillers(
        transcript
    )

    word_count = speaking_rate["word_count"]

    if word_count > 0:
        filler_rate = round(
            (filler_metrics["filler_count"] / word_count) * 100,
            2,
        )
    else:
        filler_rate = 0.0

    speaking_rate_category = classify_speaking_rate(
        speaking_rate["words_per_minute"]
    )

    return {
        "duration": round(
            duration,
            2,
        ),
        "sample_rate": sample_rate,

        "speaking_time": (
            silence_metrics["speaking_time"]
        ),

        "silence_time": (
            silence_metrics["silence_time"]
        ),

        "silence_ratio": (
            silence_metrics["silence_ratio"]
        ),

        "pause_count": (
            pause_metrics["pause_count"]
        ),

        "average_pause": (
            pause_metrics["average_pause"]
        ),

        "longest_pause": (
            pause_metrics["longest_pause"]
        ),

        "average_energy": (
            energy_metrics["average_energy"]
        ),

        "energy_variation": (
            energy_metrics["energy_variation"]
        ),

        "word_count": (
            speaking_rate["word_count"]
        ),

        "words_per_minute": (
            speaking_rate["words_per_minute"]
        ),

        "speaking_rate_category": (
            speaking_rate_category
        ),

        "filler_count": (
            filler_metrics["filler_count"]
        ),

        "filler_rate": (
            filler_rate
        ),

        "filler_words": (
            filler_metrics["filler_words"]
        ),
    }