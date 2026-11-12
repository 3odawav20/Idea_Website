from pathlib import Path
import subprocess
chrome=Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
target=Path(r"C:\Users\rakan\Desktop\idea-preview-tile-mobile-20261104.png")
profile=Path(r"C:\Users\rakan\AppData\Local\Temp\idea-preview-qa-20261104")
url="https://idea-website-gqqvqzeoh-abdelrahmanamr895-6118s-projects.vercel.app/ai-room-visualizer?product=28"
cmd=[str(chrome),"--headless=new","--no-first-run","--disable-gpu",
     "--hide-scrollbars","--window-size=390,890","--virtual-time-budget=10000",
     "--user-data-dir="+str(profile),"--screenshot="+str(target),url]
out=subprocess.run(cmd,capture_output=True,text=True,timeout=38)
print("BROWSER_EXIT",out.returncode)
print("ERROR_TAIL",out.stderr[-420:])
print("SCREEN_READY",target.exists(),target.stat().st_size if target.exists() else 0)
