"""Render the drawn demo photos (PNG) and the video frames with headless Chromium.

usage: python3 tools/draw/render.py OUT_DIR [photos|video|all]
Needs Playwright (pip install playwright && playwright install chromium). Then:
  cp OUT_DIR/{beach,picnic,bedtime,flower}.png media/photos/
  ffmpeg -framerate 24 -i OUT_DIR/frames/f%04d.png -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart media/video/hello.mp4
  ffmpeg -framerate 24 -i OUT_DIR/frames/f%04d.png -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 media/video/hello.webm
  ffmpeg -i OUT_DIR/frames/f0010.png -q:v 3 media/video/hello.jpg
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
from playwright.sync_api import sync_playwright

out = Path(sys.argv[1])
what = sys.argv[2] if len(sys.argv) > 2 else "all"
out.mkdir(parents=True, exist_ok=True)
FPS, SECONDS = 24, 6

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 960, "height": 640})
    page.set_content("<!doctype html><style>html,body{margin:0;background:#000}svg{display:block;width:960px}</style><body></body>")
    page.add_script_tag(path=str(HERE / "scenes.js"))
    if what in ("photos", "all"):
        for name in ("beach", "picnic", "bedtime", "flower"):
            page.evaluate("n => { document.body.innerHTML = SCENES[n](); }", name)
            page.locator("svg").screenshot(path=str(out / f"{name}.png"))
            print("photo", name)
    if what in ("video", "all"):
        page.set_viewport_size({"width": 960, "height": 540})
        frames = out / "frames"
        frames.mkdir(exist_ok=True)
        for i in range(FPS * SECONDS):
            page.evaluate("t => { document.body.innerHTML = SCENES.hello(t); }", i / FPS)
            page.locator("svg").screenshot(path=str(frames / f"f{i:04d}.png"))
        print("video frames", FPS * SECONDS)
    browser.close()
