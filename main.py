love = 'SudeyiSeviyorum'
output = []

for y in range(15, -15, -1):
    line = ''
    for x in range(-30, 30):
        if ((x * 0.05) ** 2 + (y * 0.1) ** 2 - 1) ** 3 - (x * 0.05) ** 2 * (y * 0.1) ** 3 <= 0:
            line += love[(x - y) % len(love)]
        else:
            line += ' '
    output.append(line)

print('\n'.join(output))
