import os, sys, struct, zlib

HEX = os.environ.get('HEX_COLOR', '002f59').lstrip('#')
r_ = int(HEX[0:2], 16)
g_ = int(HEX[2:4], 16)
b_ = int(HEX[4:6], 16)

LOGO_PATH = '/tmp/logo'
OUT_PATH = 'electron/icon.png'
SIZES = [16, 32, 64, 128, 256, 512, 1024]

has_logo = os.path.exists(LOGO_PATH) and os.path.getsize(LOGO_PATH) > 500


def make_solid_png(size, r, g, b):
    def png_chunk(name, data):
        c = zlib.crc32(name + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = png_chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))

    raw = b''
    for _ in range(size):
        raw += b'\x00' + bytes([r, g, b]) * size
    comp = zlib.compress(raw)
    idat = png_chunk(b'IDAT', comp)
    iend = png_chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


def make_logo_png(size, logo_path):
    from PIL import Image
    import io
    logo = Image.open(logo_path).convert('RGBA')
    logo = logo.resize((size, size), Image.LANCZOS)
    bg = Image.new('RGBA', (size, size), (r_, g_, b_, 255))
    bg.paste(logo, (0, 0), logo)
    buf = io.BytesIO()
    bg.convert('RGB').save(buf, 'PNG')
    return buf.getvalue()


os.makedirs('electron', exist_ok=True)

png_data = None
for s in sorted(SIZES, reverse=True):
    if has_logo:
        try:
            png_data = make_logo_png(s, LOGO_PATH)
            print(f'{s}x{s} logo')
            break
        except Exception as e:
            print(f'{s}x{s} fallback (PIL error: {e})')
    if png_data is None:
        png_data = make_solid_png(s, r_, g_, b_)
        print(f'{s}x{s} solid #{HEX}')

if png_data:
    with open(OUT_PATH, 'wb') as f:
        f.write(png_data)
    print(f'PNG gerado: {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)')