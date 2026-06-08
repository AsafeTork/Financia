import os, sys, subprocess

HEX = os.environ.get('HEX_COLOR', '002f59').lstrip('#')
r_, g_, b_ = int(HEX[0:2],16), int(HEX[2:4],16), int(HEX[4:6],16)
SIZES = {'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}
has_logo = os.path.exists('/tmp/logo') and os.path.getsize('/tmp/logo') > 500

def make_dir(d):
    os.makedirs(f'android/app/src/main/res/mipmap-{d}', exist_ok=True)

if has_logo:
    try:
        from PIL import Image
        for d, s in SIZES.items():
            make_dir(d)
            out = f'android/app/src/main/res/mipmap-{d}/ic_launcher.png'
            logo = Image.open('/tmp/logo').convert('RGBA')
            # Resize para preencher 100% — sem padding, sem fundo visivel
            logo_sq = logo.resize((s, s), Image.LANCZOS)
            # Se tem transparencia, colocar fundo da cor da marca por baixo
            bg = Image.new('RGBA', (s, s), (r_, g_, b_, 255))
            bg.paste(logo_sq, (0, 0), logo_sq)
            bg.convert('RGB').save(out, 'PNG')
            print(f'{d} {s}x{s} logo-fill')
        sys.exit(0)
    except Exception as e:
        print(f'PIL error: {e}')

# Fallback SVG default
svg = 'icon-512.svg'
if os.path.exists(svg):
    for d, s in SIZES.items():
        make_dir(d)
        out = f'android/app/src/main/res/mipmap-{d}/ic_launcher.png'
        r = subprocess.run(['rsvg-convert','-w',str(s),'-h',str(s),svg,'-o',out], capture_output=True)
        if r.returncode != 0:
            subprocess.run(['convert','-background','none','-resize',f'{s}x{s}',svg,out], capture_output=True)
        print(f'{d} {s}x{s} svg')
