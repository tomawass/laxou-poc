import os
import re

files_to_clean = ['actualites.html', 'article.html', 'agenda.html', 'archives.html', 'iframe.html', 'page-type.html']

pattern = re.compile(r'\s*<!-- Top Accessibility Bar -->\s*<div class="a11y-top-bar">.*?</div>\s*</div>', re.DOTALL)
pattern_simple = re.compile(r'\s*<div class="a11y-top-bar">.*?</div>\s*</div>', re.DOTALL)

for file in files_to_clean:
    if not os.path.exists(file):
        continue
    with open(file, 'r') as f:
        content = f.read()
    
    # Remove top bar
    new_content = pattern.sub('', content)
    if new_content == content:
        new_content = pattern_simple.sub('', content)
        
    with open(file, 'w') as f:
        f.write(new_content)

print("Top accessibility bars removed.")
