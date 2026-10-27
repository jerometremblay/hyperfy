"""Generate regulation board artwork in the same metres used by game scoring."""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

SIDE = 1536
SCALE = SIDE / .46
image = Image.new("RGB", (SIDE, SIDE), "#161d1a")
draw = ImageDraw.Draw(image)
center = SIDE / 2
segments = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]

def xy(radius, angle):
    return center + math.sin(angle) * radius * SCALE, center - math.cos(angle) * radius * SCALE

def wedge(inner, outer, start, end, color):
    steps = 20
    points = [xy(outer, start + (end-start)*i/steps) for i in range(steps+1)]
    points += [xy(inner, end - (end-start)*i/steps) for i in range(steps+1)]
    draw.polygon(points, fill=color)

try:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 68)
except OSError:
    font = ImageFont.load_default(size=68)
for i, number in enumerate(segments):
    angle = i * math.pi / 10
    a, b = angle - math.pi/20, angle + math.pi/20
    single = "#202825" if i % 2 == 0 else "#e5d8b9"
    ring = "#bd4139" if i % 2 == 0 else "#328567"
    for inner, outer, color in [(.0159,.099,single),(.099,.107,ring),(.107,.162,single),(.162,.170,ring)]:
        wedge(inner, outer, a, b, color)
    draw.line([xy(.0159,a),xy(.170,a)], fill="#aea995", width=3)
    draw.text(xy(.196, angle), str(number), font=font, anchor="mm", fill="#ecdfc2")
for r in [.170, .162, .107, .099]:
    v = r*SCALE
    draw.ellipse((center-v, center-v, center+v, center+v), outline="#aea995", width=3)
for r,c in [(.0159, "#328567"), (.00635, "#bd4139")]:
    v = r*SCALE
    draw.ellipse((center-v, center-v, center+v, center+v), fill=c, outline="#aea995", width=3)
out = Path(__file__).parent / "board.png"
image.save(out, optimize=True)
print(out)
