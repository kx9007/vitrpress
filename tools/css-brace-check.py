import sys

path = 'docs/.vitepress/theme/custom.css'
raw = open(path, encoding='utf-8').read()

i = 0
depth = 0
line = 1
n = len(raw)
BACKSLASH = chr(92)
QUOTES = ('"', "'")

while i < n:
    ch = raw[i]
    if ch == '\n':
        line += 1
        i += 1
        continue

    # block comment
    if ch == '/' and i + 1 < n and raw[i + 1] == '*':
        j = raw.find('*/', i + 2)
        if j == -1:
            print('未闭合的注释，从行', line)
            break
        line += raw[i:j + 2].count('\n')
        i = j + 2
        continue

    # string
    if ch in QUOTES:
        q = ch
        j = i + 1
        while j < n and raw[j] != q:
            if raw[j] == BACKSLASH:
                j += 2
                continue
            if raw[j] == '\n':
                line += 1
            j += 1
        i = j + 1
        continue

    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth < 0:
            lines = raw.splitlines()
            print('多余 } 在行', line)
            for k in range(max(0, line - 6), min(len(lines), line + 2)):
                print('%4d| %s' % (k + 1, lines[k]))
            break
    i += 1

print('最终 depth:', depth)
