from PIL import Image, ImageDraw

# Cria imagem 1024x1024 com fundo gradiente azul
size = 1024
img = Image.new('RGBA', (size, size))
draw = ImageDraw.Draw(img)

# Background gradiente azul
for y in range(size):
    r = int(59 + (30 - 59) * y / size)
    g = int(130 + (64 - 130) * y / size)
    b = int(246 + (175 - 246) * y / size)
    draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b, 255))

# Arredonda cantos
radius = 180
mask = Image.new('L', (size, size), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
img.putalpha(mask)

# Clipboard body (retângulo cinza claro)
clip_x, clip_y, clip_w, clip_h = 256, 192, 512, 640
draw.rounded_rectangle(
    [(clip_x, clip_y), (clip_x + clip_w, clip_y + clip_h)],
    radius=40, fill=(226, 232, 240, 255), outline=(148, 163, 184, 255), width=8
)

# Clipboard clip (topo)
clip_top = [
    (362, 192), (362, 160), (394, 128), (630, 128), (662, 160), (662, 192)
]
draw.polygon(clip_top, fill=(100, 116, 139, 255))
draw.rounded_rectangle([(394, 128), (630, 176)], radius=24, fill=(71, 85, 105, 255))

# Checkmark (verde grande) - Sombra
draw.line([(345, 505), (445, 625)], fill=(22, 163, 74, 200), width=80, joint='curve')
draw.line([(445, 625), (705, 345)], fill=(22, 163, 74, 200), width=80, joint='curve')

# Checkmark principal
draw.line([(340, 500), (440, 620)], fill=(34, 197, 94, 255), width=80, joint='curve')
draw.line([(440, 620), (700, 340)], fill=(34, 197, 94, 255), width=80, joint='curve')

# Salva
img.save('icon.png')
print('✅ Ícone 1024x1024 criado com sucesso!')
