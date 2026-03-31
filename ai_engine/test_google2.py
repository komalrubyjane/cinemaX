import urllib.request
import urllib.parse
import re
import html
import sys

def get_google_poster(title):
    query = f"{title} movie poster"
    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&tbm=isch"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html_content = urllib.request.urlopen(req, timeout=5).read().decode('utf-8')
        m = re.search(r'src="(https://encrypted-tbn0\.gstatic\.com/images\?q=[^"]+)"', html_content)
        if m:
            return html.unescape(m.group(1))
    except Exception as e:
        return str(e)
    return None

print(f"Matrix: {get_google_poster('The Matrix')}")
print(f"Toy Story: {get_google_poster('Toy Story')}")
print(f"Jumanji: {get_google_poster('Jumanji')}")
