import subprocess,time,json,base64
from pathlib import Path
import requests,websocket
port=9362
root=Path(r"C:\Users\rakan\Desktop")
pagesRoot=root/"IDEA_Company_Control_20261103"/"server"/"cpanel"/"marketplace"
proc=subprocess.Popen([r"C:\Program Files\Google\Chrome\Application\chrome.exe",
 "--headless=new","--disable-gpu","--no-first-run","--no-sandbox","--remote-allow-origins=*",
 f"--remote-debugging-port={port}",f"--user-data-dir={root/'idea_marketplace_locale_profile'}","about:blank"],
 stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(60):
  try:
   page=next(x for x in requests.get(f"http://127.0.0.1:{port}/json",timeout=1).json() if x["type"]=="page")
   break
  except Exception: time.sleep(.3)
 sock=websocket.create_connection(page["webSocketDebuggerUrl"],origin="http://localhost",timeout=22)
 n=0
 def call(method,params=None):
  global n
  n+=1; ident=n
  sock.send(json.dumps({"id":ident,"method":method,"params":params or {}}))
  while True:
   event=json.loads(sock.recv())
   if event.get("id")==ident:
    if event.get("error"):raise RuntimeError(event["error"])
    return event.get("result",{})
 def js(code):
  payload=call("Runtime.evaluate",{"expression":code,"returnByValue":True})
  if payload.get("exceptionDetails"):raise RuntimeError(payload["exceptionDetails"])
  return payload["result"].get("value")
 call("Page.enable");call("Runtime.enable")
 for lang,name in [("en","en.html"),("ar","index.html")]:
  for w in [1300,390]:
   call("Emulation.setDeviceMetricsOverride",{"width":w,"height":850,"deviceScaleFactor":1,"mobile":w==390})
   url=(pagesRoot/name).as_uri()
   call("Page.navigate",{"url":url})
   time.sleep(1.3)
   expression="""JSON.stringify({lang:document.documentElement.lang,dir:document.documentElement.dir,chars:document.body.innerText.length,arabicChars:(document.body.innerText.match(/[\\u0600-\\u06FF]/g)||[]).length,viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,header:document.querySelector('#page-title')?.textContent,buttons:[...document.querySelectorAll('.sections button')].map(e=>e.textContent.trim()).slice(0,5)})"""
   state=json.loads(js(expression))
   print("LOCALE_QA",lang,w,json.dumps(state,ensure_ascii=False),flush=True)
   if lang=="en": assert state["arabicChars"]==0,"Arabic shown in English chrome"
   assert state["lang"]==lang
   assert state["scroll"]<=state["viewport"]+2,"Horizontal overflow"
   pic=call("Page.captureScreenshot",{"format":"png","captureBeyondViewport":False})["data"]
   (root/f"idea_marketplace_{lang}_{w}.png").write_bytes(base64.b64decode(pic))
 sock.close()
finally:
 proc.terminate()
