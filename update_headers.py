import os
import re

files_to_update = ['actualites.html', 'article.html', 'agenda.html', 'archives.html', 'iframe.html', 'page-type.html']

with open('header_template.html', 'r') as f:
    template = f.read()

for file in files_to_update:
    if not os.path.exists(file):
        continue
        
    with open(file, 'r') as f:
        content = f.read()
        
    # Find the header block
    header_pattern = re.compile(r'<header class="site-header">.*?</header>', re.DOTALL)
    
    # Replace the active class logic depending on the file
    file_template = template
    file_template = file_template.replace('class="nav-link active"', 'class="nav-link"')
    
    if file == 'actualites.html' or file == 'article.html':
        file_template = file_template.replace('href="actualites.html" class="nav-link" aria-haspopup="true">Actualités', 'href="actualites.html" class="nav-link active" aria-haspopup="true">Actualités')
    elif file == 'archives.html':
        file_template = file_template.replace('href="archives.html" class="nav-link" aria-haspopup="true">Démarches', 'href="archives.html" class="nav-link active" aria-haspopup="true">Démarches')
    elif file == 'iframe.html':
        file_template = file_template.replace('href="iframe.html" class="nav-link" aria-haspopup="true">Vivre à Laxou', 'href="iframe.html" class="nav-link active" aria-haspopup="true">Vivre à Laxou')
    elif file == 'page-type.html':
        file_template = file_template.replace('href="page-type.html" class="nav-link" aria-haspopup="true">Ma mairie', 'href="page-type.html" class="nav-link active" aria-haspopup="true">Ma mairie')

    # Also make sure links in the template that say "article.html" for actualites are updated to "actualites.html"
    file_template = file_template.replace('href="article.html" class="nav-link" aria-haspopup="true">Actualités', 'href="actualites.html" class="nav-link" aria-haspopup="true">Actualités')
    
    new_content = header_pattern.sub(file_template, content)
    
    with open(file, 'w') as f:
        f.write(new_content)
        
print("Headers updated.")
