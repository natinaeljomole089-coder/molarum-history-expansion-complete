from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "icon.png"
TARGETS = [
    ROOT / "assets" / "images" / "icon.png",
    ROOT / "assets" / "images" / "splash-icon.png",
    ROOT / "assets" / "images" / "favicon.png",
    ROOT / "assets" / "images" / "android-icon-foreground.png",
]

with Image.open(SOURCE) as image:
    rendered = image.convert("RGB").resize((512, 512), Image.Resampling.LANCZOS)
    for target in TARGETS:
        rendered.save(target, "PNG", optimize=True, compress_level=9)
