#!/usr/bin/env python3
"""
generate_icons.py
한글 모험대 PWA 아이콘 생성 스크립트

사용법:
  pip install cairosvg
  python3 generate_icons.py

icons/ 폴더에 PNG 아이콘 파일들이 생성됩니다.
"""

import os
import sys

try:
    import cairosvg
except ImportError:
    print("cairosvg 패키지가 필요합니다.")
    print("설치 방법: pip install cairosvg")
    sys.exit(1)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SVG_PATH = os.path.join(SCRIPT_DIR, 'icons', 'icon.svg')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'icons')

SIZES = [72, 96, 128, 144, 192, 512]


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if not os.path.exists(SVG_PATH):
        print(f"SVG 파일을 찾을 수 없습니다: {SVG_PATH}")
        sys.exit(1)

    for size in SIZES:
        output_path = os.path.join(OUTPUT_DIR, f'icon-{size}.png')
        cairosvg.svg2png(
            url=SVG_PATH,
            write_to=output_path,
            output_width=size,
            output_height=size
        )
        print(f"✅ 생성 완료: icons/icon-{size}.png ({os.path.getsize(output_path):,} bytes)")

    print("\n🎉 모든 아이콘 생성이 완료됐습니다!")


if __name__ == '__main__':
    main()
