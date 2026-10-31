#!/usr/bin/env python3
"""
生成主题配色 themes.css

用 OKLCH 做色彩空间转换，保证单色主题（不蕉绿/绝绝紫…）也有明暗层次，
而不是简单地把一个 hex 到处复制导致发闷。

用法：python tools/gen-themes.py
"""
import math
import os

# ---------- OKLCH -> sRGB ----------
def oklch_to_srgb(L, C, H):
    """返回 (r,g,b) 0-255，超出 sRGB 色域时返回 None"""
    a = C * math.cos(math.radians(H))
    b = C * math.sin(math.radians(H))

    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b

    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3

    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def gamma(x):
        if x < -0.001 or x > 1.001:
            return None
        x = max(0.0, min(1.0, x))
        return x * 12.92 if x <= 0.0031308 else 1.055 * (x ** (1 / 2.4)) - 0.055

    out = []
    for v in (r, g, bb):
        e = gamma(v)
        if e is None:
            return None
        out.append(round(e * 255))

    return tuple(out)


def hexof(L, C, H):
    """带色域压缩：超出时逐步降 chroma"""
    c = C
    while c > 0:
        rgb = oklch_to_srgb(L, c, H)
        if rgb:
            return "#%02x%02x%02x" % rgb
        c -= 0.004
    rgb = oklch_to_srgb(L, 0, H)
    return "#%02x%02x%02x" % rgb


def rgba(hexcolor, alpha):
    h = hexcolor.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r}, {g}, {b}, {alpha})"


# ---------- 主题定义 ----------
# hue: 主色相；chroma: 彩度；spread: 8 个色环停靠点相对主色的色相展开幅度
THEMES = [
    {
        "id": "rainbow",
        "name": "七彩光谱",
        "hue": 260,
        "chroma": 0.19,
        # 彩虹：整圈铺开
        "hues": [10, 55, 90, 145, 200, 255, 275, 320],
        "chroma_scale": 1.18,
    },
    {
        "id": "green",
        "name": "不蕉绿",
        "hue": 152,
        "chroma": 0.15,
        "hues": [136, 144, 152, 160, 168, 144, 152, 160],
        "chroma_scale": 0.92,
    },
    {
        "id": "purple",
        "name": "绝绝紫",
        "hue": 295,
        "chroma": 0.17,
        "hues": [280, 288, 295, 303, 311, 288, 295, 303],
        "chroma_scale": 0.95,
    },
    {
        "id": "blue",
        "name": "不摆蓝",
        "hue": 248,
        "chroma": 0.16,
        "hues": [232, 240, 248, 256, 264, 240, 248, 256],
        "chroma_scale": 0.94,
    },
    {
        "id": "amber",
        "name": "焦太宗",
        "hue": 62,
        "chroma": 0.13,
        "hues": [44, 52, 60, 70, 80, 52, 60, 70],
        "chroma_scale": 0.9,
    },
    {
        "id": "red",
        "name": "发财红",
        "hue": 24,
        "chroma": 0.18,
        "hues": [10, 16, 22, 28, 34, 16, 22, 28],
        "chroma_scale": 0.96,
    },
]

# 色环上 8 个停靠点的明度，做轻微起伏让彩虹边有"流光"感
RING_L = [0.66, 0.74, 0.82, 0.74, 0.66, 0.62, 0.60, 0.64]

# 彩虹主题单独用更亮的阶梯（整圈铺开时低明度会显暗沉）
RING_L_RAINBOW = [0.70, 0.80, 0.86, 0.78, 0.72, 0.66, 0.64, 0.68]


def build_theme(t):
    """生成一个主题的 CSS 变量块"""
    hue = t["hue"]
    chroma = t["chroma"]
    cs = t["chroma_scale"]
    hues = t["hues"]

    l_scale = RING_L_RAINBOW if t["id"] == "rainbow" else RING_L
    ring = []
    for i, h in enumerate(hues):
        ring.append(hexof(l_scale[i], chroma * cs, h))

    lines = [f'html[data-theme="{t["id"]}"] {{']

    # 8 个彩虹停靠点 + 对应 rgba
    for i, c in enumerate(ring, 1):
        lines.append(f"  --rb-{i}: {c};")
    for i, c in enumerate(ring, 1):
        lines.append(f"  --rb-a-{i}: {rgba(c, 0.38)};")

    # 文字渐变：同色系明暗流动，首尾闭合
    # 暖色（黄/金/红）本身明度高，浅底上必须压深，否则看不清
    # 高明度色相（黄/金/红/蓝）在浅底上需要压深，否则对比不足
    light_hue = hue in (62, 24, 248, 152)
    base_l = 0.50 if light_hue else 0.66
    lift = 0.11 if light_hue else 0.12
    text_stops = [
        hexof(base_l, chroma * cs * 1.0, hues[0]),
        hexof(base_l + lift, chroma * cs * 0.9, hues[2]),
        hexof(base_l - 0.06, chroma * cs * 1.05, hues[4]),
        hexof(base_l + lift * 0.7, chroma * cs * 0.95, hues[6]),
        hexof(base_l, chroma * cs * 1.0, hues[0]),
    ]
    lines.append("  --rb-text: linear-gradient(")
    lines.append("    102deg,")
    for i, c in enumerate(text_stops):
        pct = [0, 25, 50, 75, 100][i]
        lines.append(f"    {c} {pct}%,")
    lines[-1] = lines[-1].rstrip(",")
    lines.append("  );")

    # 品牌色（浅色模式）
    b1 = hexof(0.58, chroma * 1.0, hue)
    b2 = hexof(0.68, chroma * 0.85, hue)
    b3 = hexof(0.48, chroma * 1.05, hue)
    lines.append(f"  --vp-c-brand-1: {b1};")
    lines.append(f"  --vp-c-brand-2: {b2};")
    lines.append(f"  --vp-c-brand-3: {b3};")
    lines.append(f"  --vp-c-brand-soft: {rgba(b1, 0.1)};")

    # 深色模式的品牌色（更亮，保证对比）
    lines.append(f'  --brand-dark-1: {hexof(0.78, chroma * 0.9, hue)};')
    lines.append(f'  --brand-dark-2: {hexof(0.70, chroma * 1.0, hue)};')
    lines.append(f'  --brand-dark-3: {hexof(0.62, chroma * 1.0, hue)};')

    # 主按钮渐变
    g1 = hexof(0.62, chroma * 1.05, hue)
    g2 = hexof(0.55, chroma * 0.95, hue + 18)
    lines.append(f"  --accent-grad: linear-gradient(150deg, {g1}, {g2});")
    lines.append(f"  --accent-glow: {rgba(g1, 0.5)};")

    # 极光光斑（5 个，用主色相附近的小偏移）
    aurora_hues = [hue - 26, hue + 10, hue + 30, hue - 12, hue + 44]
    aurora = [hexof(0.66, chroma * 0.95, h) for h in aurora_hues]
    for i, c in enumerate(aurora, 1):
        lines.append(f"  --aurora-{i}: {c};")

    # 区块内的柔和补光
    soft = [hexof(0.70, chroma * 0.45, h) for h in (hue - 10, hue + 14, hue + 34)]
    for i, c in enumerate(soft, 1):
        lines.append(f"  --soft-{i}: {rgba(c, 0.1)};")

    # 头像球内部色斑（暖色压暗一档，避免高饱和橙红跳出画面）
    orb_l = 0.52 if hue in (62, 24) else 0.60
    orb_c = 0.95 if hue in (62, 24) else 1.15
    orb = [hexof(orb_l, chroma * orb_c, h) for h in (hue - 18, hue + 8, hue + 26, hue + 42)]
    for i, c in enumerate(orb, 1):
        lines.append(f"  --orb-{i}: {c};")

    # 侧边栏激活色用品牌主色即可，无需额外变量
    lines.append("}")

    # 深色模式覆盖：html.dark[data-theme] 特异性高于 .dark，
    # 否则 themes.css 里的浅色品牌色会盖掉深色模式应有的亮度
    lines.append("")
    lines.append(f'html.dark[data-theme="{t["id"]}"] {{')
    lines.append(f"  --vp-c-brand-1: {hexof(0.78, chroma * 0.9, hue)};")
    lines.append(f"  --vp-c-brand-2: {hexof(0.70, chroma * 1.0, hue)};")
    lines.append(f"  --vp-c-brand-3: {hexof(0.62, chroma * 1.0, hue)};")
    lines.append(
        f"  --vp-c-brand-soft: {rgba(hexof(0.78, chroma * 0.9, hue), 0.16)};"
    )
    lines.append("}")

    return "\n".join(lines)


def main():
    blocks = []
    blocks.append("/* =========================================================\n"
                  "   主题配色（自动生成，勿手改）\n"
                  "   源文件：tools/gen-themes.py   →   运行 python tools/gen-themes.py\n"
                  "   每个主题提供：彩虹停靠点 / 文字渐变 / 品牌色 / 极光 / 光球 / 主按钮\n"
                  "   ========================================================= */\n")

    for t in THEMES:
        blocks.append(f"/* ---------- {t['name']} ({t['id']}) ---------- */")
        blocks.append(build_theme(t))
        blocks.append("")

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, "docs", ".vitepress", "theme", "themes.css")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))

    print(f"生成 {out}")
    for t in THEMES:
        print(f"  - {t['name']}  hue={t['hue']}")


if __name__ == "__main__":
    main()
