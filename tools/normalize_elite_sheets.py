from pathlib import Path
from PIL import Image

ROOT = Path('/home/ubuntu/fumiga-game-preview')
NAMES = ['elite_spy', 'elite_acid_spitter', 'elite_giant', 'elite_healer']
for name in NAMES:
    source = Image.open(ROOT / f'{name}_sheet.png').convert('RGBA')
    cell_w, cell_h = source.width // 8, source.height // 3
    output = Image.new('RGBA', (32 * 8, 32 * 3), (0, 0, 0, 0))
    for row in range(3):
        for col in range(8):
            cell = source.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
            bbox = cell.getbbox()
            if bbox:
                cell = cell.crop(bbox)
            cell.thumbnail((29, 29), Image.Resampling.LANCZOS)
            x = col * 32 + (32 - cell.width) // 2
            y = row * 32 + (32 - cell.height) // 2
            output.alpha_composite(cell, (x, y))
    output.save(ROOT / f'{name}_normalized.png', optimize=True)
    print(name, source.size, '->', output.size)
