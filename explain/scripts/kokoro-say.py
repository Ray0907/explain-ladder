# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["kokoro-onnx==0.6.1", "soundfile", "misaki-fork[zh]==0.9.6"]
# ///
"""Run: uv run --script kokoro-say.py 'text' out.wav zh-TW|en"""
import os
from pathlib import Path
import sys
from urllib.request import urlretrieve

import soundfile as sf
from kokoro_onnx import Kokoro

text, output, lang = sys.argv[1:]
if not text.strip() or not (lang.startswith("zh") or lang.startswith("en")):
	raise ValueError("Expected non-empty text and lang zh-TW or en")
cache = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "explain-kokoro"
cache.mkdir(parents=True, exist_ok=True)
version = "v1.1-zh" if lang.startswith("zh") else "v1.0"
base = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/"
files = [f"kokoro-{version}.onnx", f"voices-{version}.bin"]
urls = [base + name for name in files]
if lang.startswith("zh"):
	files.append("config-v1.1-zh.json")
	urls.append("https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh/raw/main/config.json")
for name, url in zip(files, urls):
	path = cache / name
	if not path.exists():
		print(f"Downloading {name}", file=sys.stderr)
		temporary = path.with_suffix(".part")
		urlretrieve(url, temporary)
		temporary.replace(path)
options = {"vocab_config": str(cache / files[2])} if len(files) == 3 else {}
kokoro = Kokoro(str(cache / files[0]), str(cache / files[1]), **options)
if lang.startswith("zh"):
	from misaki import zh
	english = lambda value: kokoro.tokenizer.phonemize(value, lang="en-us")
	phonemes, _ = zh.ZHG2P(version="1.1", en_callable=english)(text)
	samples, rate = kokoro.create(phonemes, voice="zf_001", is_phonemes=True)
else:
	samples, rate = kokoro.create(text, voice="af_heart", lang="en-us")
if len(samples) == 0:
	raise RuntimeError("Kokoro produced no audio")
sf.write(output, samples, rate)
print(f"kokoro: {lang}, {len(samples) / rate:.2f}s -> {output}")
