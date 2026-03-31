import urllib.request
import re

req = urllib.request.Request('https://www.themoviedb.org/movie/862', headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    m = re.search(r'meta property="og:image"\s+content="(.*?)"', html)
    print(m.group(1) if m else 'Not found')
except Exception as e:
    print("Error:", e)
