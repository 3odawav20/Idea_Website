import subprocess,time,json,base64
from pathlib import Path
import requests,websocket
port=9359
base="http://127.0.0.1:4189"
root=Path(r"C:\Users\rakan\Desktop")
proc=subprocess.Popen([r"C:\Program Files\Google\Chrome\Application\chrome.exe","--headless=new","--disable-gpu","--no-sandbox","--no-first-run","--remote-allow-origins=*","--remote-debugging-port="+str(port),"--user-data-dir="+str(root/"idea_locale_qa_20261103"),"about:blank"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(60):
  try:
   pages=requests.get(f"http://127.0.0.1:{port}/json",timeout=1).json()
   page=next(x for x in pages if x["type"]=="page")
   break
  except:time.sleep(.2)
 ws=websocket.create_connection(page["webSocketDebuggerUrl"],origin="http://localhost",timeout=25)
 n=0
 def call(method,params=None):
  global n
  n+=1; i=n
  ws.send(json.dumps({"id":i,"method":method,"params":params or {}},ensure_ascii=False))
  while True:
   m=json.loads(ws.recv())
   if m.get("id")==i:
    if "error" in m:raise RuntimeError(m["error"])
    return m.get("result",{})
 def ev(expr):
  x=call("Runtime.evaluate",{"expression":expr,"returnByValue":True,"awaitPromise":True})
  if "exceptionDetails" in x: print("JS_ERROR",str(x["exceptionDetails"])[:380])
  return x["result"].get("value")
 call("Runtime.enable");call("Page.enable")
 for w,lang in [(1300,"en"),(390,"en"),(1300,"ar"),(390,"ar")]:
  call("Emulation.setDeviceMetricsOverride",{"width":w,"height":850,"deviceScaleFactor":1,"mobile":w<600})
  call("Page.navigate",{"url":base})
  time.sleep(2.3)
  ev(f"""localStorage.setItem('idea-language','{lang}');location.reload();'ok'""")
  time.sleep(2.5)
  x=ev("""(()=>{const txt=document.body.innerText;const matches=txt.match(/[\u0600-\u06FF]+/g)||[];return {lang:document.documentElement.lang,dir:document.documentElement.dir,arabicWords:matches.slice(0,18),arabicCount:matches.length,scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth,bodyChars:txt.length,head:txt.slice(0,220)}})()""")
  print("PAGE",w,lang,json.dumps(x,ensure_ascii=False))
  x2=ev("""({stored:localStorage.getItem('idea-language'),buttons:[...document.querySelectorAll('button')].filter(e=>['EN','AR','FR'].includes(e.innerText.trim())).map(e=>[e.innerText,e.style.color])})""")
  print("LANG_BUTTONS",json.dumps(x2,ensure_ascii=False))
  pic=call("Page.captureScreenshot",{"format":"png","captureBeyondViewport":False})["data"]
  (root/f"idea_locale_{lang}_{w}.png").write_bytes(base64.b64decode(pic))
 ws.close()
finally:proc.terminate()
