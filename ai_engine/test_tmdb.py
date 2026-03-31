import urllib.request
from bs4 import BeautifulSoup
import re

url = 'https://www.themoviedb.org/movie/862' # Toy Story
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8')
soup = BeautifulSoup(html, 'html.parser')

runtime_el = soup.find('span', class_='runtime')
runtime = runtime_el.text.strip() if runtime_el else "Unknown"

cast = []
for li in soup.find_all('li', class_='card'):
    name_el = li.find('p')
    if name_el and name_el.find('a'):
        cast.append(name_el.find('a').text.strip())

print("Runtime:", runtime)
print("Cast:", ", ".join(cast[:5]))
