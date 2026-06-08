import os, sys, subprocess, struct, zlib

HEX   = os.environ.get('HEX_COLOR', '002f59').lstrip('#')
r_,g_,b_ = int(HEX[0:2],16), int(HEX[2:4],16), int(HEX[4:6],16)
SIZES = {'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}

has_logo = os.path.exists('/tmp/logo') and os.path.getsize('/tmp/logo') > 500

def make_dir(d, s):
    os.makedirs(f'android/app/src/main/res/mipmap-{d}', exist_ok=True)

if has_logo:
    try:
        from PIL import Image
        for d, s in SIZES.items():
            img = Image.open('/tmp/logo').convert('RGBA')
            # Criar fundo quadrado com a cor
            bg = Image.new('RGBA', (s, s), (r_, g_, b_, 255))
            # Redimensionar logo para preencher tudo (sem padding)
            logo = img.resize((s, s), Image.LANCZOS)
            # Compor: fundo + logo por cima
            bg.paste(logo, (0, 0), logo)
            make_dir(d, s)
            bg.save(f'android/app/src/main/res/mipmap-{d}/ic_launcher.png')
            print(f'{d} {s}x{s} (logo full)')
        sys.exit(0)
    except Exception as e:
        print(f'PIL error: {e}')

svg_path = 'icon-512.svg'
if os.path.exists(svg_path):
    for d, s in SIZES.items():
        out = f'android/app/src/main/res/mipmap-{d}/ic_launcher.png'
        make_dir(d, s)
        result = subprocess.run(
            ['rsvg-convert', '-w', str(s), '-h', str(s), svg_path, '-o', out],
            capture_output=True
        )
        if result.returncode == 0:
            print(f'{d} {s}x{s} via rsvg-convert')
        else:
            result2 = subprocess.run(
                ['convert', '-background', 'none', '-resize', f'{s}x{s}', svg_path, out],
                capture_output=True
            )
            if result2.returncode == 0:
                print(f'{d} {s}x{s} via ImageMagick')
            else:
                def chunk(t,d_):
                    c=struct.pack('>I',len(d_))+t+d_
                    return c+struct.pack('>I',zlib.crc32(t+d_)&0xffffffff)
                raw=b''.join(b'\x00'+bytes([r_,g_,b_]*s) for _ in range(s))
                png=(b'\x89PNG\r\n\x1a\n'
                    +chunk(b'IHDR',struct.pack('>IIBBBBB',s,s,8,2,0,0,0))
                    +chunk(b'IDAT',zlib.compress(raw))
                    +chunk(b'IEND',b''))
                with open(out,'wb') as f: f.write(png)
                print(f'{d} {s}x{s} fallback')
