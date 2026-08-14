import os
import re

files_to_clean = ['actualites.html', 'article.html', 'agenda.html', 'archives.html', 'iframe.html', 'page-type.html', 'index.html']

pattern = re.compile(r'\s*<nav aria-label="Fil d\'Ariane">.*?</nav>', re.DOTALL)

for file in files_to_clean:
    if not os.path.exists(file):
        continue
    with open(file, 'r') as f:
        content = f.read()
    
    new_content = pattern.sub('', content)
    
    with open(file, 'w') as f:
        f.write(new_content)

print("Breadcrumbs removed from all pages.")
