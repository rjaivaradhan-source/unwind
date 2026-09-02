from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ASSETS / "thumbs"
OUT.mkdir(exist_ok=True)

FILES = [
    "electric-hammer.png", "laser-pistol.png", "paintball-marker.png",
    "chainsaw-realistic.png", "machine-gun-realistic.png",
    "flamethrower-realistic.png", "stamp-realistic.png",
    "termite-box-realistic.png", "washer-blaster.png",
    "baseball-bat-realistic.png", "grenade-realistic.png",
    "slap-hand-realistic.png", "boxing-gloves-realistic.png",
    "gravity-orb.png",
]

def clear_connected_light_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    px = image.load()
    w, h = image.size
    seen = bytearray(w * h)
    queue = deque()

    def background(x, y):
        r, g, b, a = px[x, y]
        return a == 0 or (min(r, g, b) > 218 and max(r, g, b) - min(r, g, b) < 24)

    for x in range(w):
        for y in (0, h - 1):
            if background(x, y): queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if background(x, y): queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        i = y * w + x
        if seen[i] or not background(x, y): continue
        seen[i] = 1
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        if x: queue.append((x - 1, y))
        if x + 1 < w: queue.append((x + 1, y))
        if y: queue.append((x, y - 1))
        if y + 1 < h: queue.append((x, y + 1))
    return image

for name in FILES:
    image = clear_connected_light_background(Image.open(ASSETS / name))
    alpha = image.getchannel("A")
    box = alpha.getbbox() or (0, 0, *image.size)
    image = image.crop(box)
    image.thumbnail((230, 180), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (256, 192), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((256 - image.width) // 2, (192 - image.height) // 2))
    canvas.save(OUT / name, optimize=True)
