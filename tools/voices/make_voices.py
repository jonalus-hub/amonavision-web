"""Cartoon gibberish voice notes for the website demo.

Kokoro TTS (Apache-2.0) speaks made-up words with an Italian/Spanish/Portuguese
voice (they sound musical, like a game's nonsense language), then ffmpeg raises
the pitch for a cartoon voice. The words are invented here: no real language,
and none of the Minions' or the Sims' own words. "Amona" is the only real word.

usage: python3 tools/voices/make_voices.py FFMPEG OUT_DIR KOKORO_DIR
  pip install kokoro-onnx soundfile
  KOKORO_DIR holds kokoro-v1.0.onnx and voices-v1.0.bin from
  https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
Then copy OUT_DIR/*.mp3 to media/voice/.
"""
import subprocess
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

FFMPEG = sys.argv[1]
OUT = Path(sys.argv[2])
MODELS = Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)

NOTES = [
    # name, voice, lang, pitch, tempo, extra filter, text
    ("01-beach-walk", "if_sara", "it", 1.45, 1.12, "",
     "Amona! Ohh, splishi splasha! Brrr, frizzo frizzo, i bimbi no vola fuori! Mwah, mwah, bacciu tuttu!"),
    ("03-picnic-dog", "em_alex", "es", 1.32, 1.08, "",
     "Amona, lukka lukka! Pikka nikka nel parko... wuffi wuffi, ja ja ja! Sundibu, bidi bidi!"),
    ("07-bedtime-story", "ef_dora", "es", 1.5, 1.0, "",
     "Nanni nanni, Amona... libbo libbo, shamú dorma. Ninni, ninni... mwah!"),
    ("grandma-reply", "pf_dora", "pt-br", 1.22, 0.92, ",vibrato=f=5.5:d=0.25",
     "Ohhh! Bellinu, bellinu! Mi tutti amori... mwah, mwah, mwah!"),
]

k = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
for name, voice, lang, pitch, tempo, extra, text in NOTES:
    samples, sr = k.create(text, voice=voice, speed=1.0, lang=lang)
    wav = OUT / f"{name}.raw.wav"
    sf.write(wav, samples, sr)
    af = f"asetrate={sr}*{pitch},aresample={sr},atempo={tempo / pitch:.4f}{extra},loudnorm=I=-18:TP=-2"
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-af", af,
                    "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "48k", str(OUT / f"{name}.mp3")], check=True)
    wav.unlink()
    print(name, voice, round(len(samples) / sr / tempo, 1), "s")
