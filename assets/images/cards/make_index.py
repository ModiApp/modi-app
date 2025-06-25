from os import listdir
from os.path import isdir

out = 'export default {\n'

for folder in (f for f in listdir('.') if isdir(f)):
    out += '\t' + folder + ': {\n'
    for img in listdir(folder):
        if img == '.DS_Store':
            continue
        out += f"\t\t{img.split('.')[0]}: require('./{folder}/{img}'),\n"
    out += '\t},\n'
out += '};\n'

with open('index.js', 'w') as index_file:
    index_file.write(out)
