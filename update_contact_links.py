import os
import re

files = [
    'actualites.html', 'agenda.html', 'archives.html', 'article.html', 
    'header_template.html', 'iframe.html', 'index.html', 'nprnu-map.html', 
    'page-type.html', 'simulateur-periscolaire.html'
]

for file in files:
    if not os.path.exists(file):
        continue
    with open(file, 'r') as f:
        content = f.read()
    
    # Replace contact links
    new_content = content.replace('href="page-type.html" class="nav-link" aria-haspopup="true">Contact ▾', 'href="contact.html" class="nav-link" aria-haspopup="true">Contact ▾')
    new_content = new_content.replace('href="page-type.html">Formulaire de contact</a>', 'href="contact.html">Formulaire de contact</a>')
    new_content = new_content.replace('href="page-type.html">Annuaire des services municipaux</a>', 'href="contact.html">Annuaire des services municipaux</a>')
    new_content = new_content.replace('href="page-type.html">Signalements (voirie, éclairage, etc.)</a>', 'href="contact.html">Signalements (voirie, éclairage, etc.)</a>')
    new_content = new_content.replace('href="page-type.html">Rendez-vous avec le Maire</a>', 'href="contact.html">Rendez-vous avec le Maire</a>')
    
    with open(file, 'w') as f:
        f.write(new_content)

print("Contact links updated in headers.")
