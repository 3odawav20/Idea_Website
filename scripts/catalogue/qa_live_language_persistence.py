import subprocess,time,json
from pathlib import Path
import requests,websocket
port=9365
proc=subprocess.Popen([r"C:\Program Files\Google\Chrome\Application\chrome.exe",
 "--headless=new","--disable-gpu","--no-first-run","--no-sandbox","--remote-allow-origins=*",
 f"--remote-debugging-port={port}","--user-data-dir=C:/Users/rakan/Desktop/idea_live_lang_qa_profile","about:blank"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(55):
  try:
   page=next(x for x in requests.get(f"http://127.0.0.1:{port}/json",timeout=1).json() if x["type"]=="page")
   break
  except Exception:time.sleep(.2)
 sock=websocket.create_connection(page["webSocketDebuggerUrl"],origin="http://localhost",timeout=22)
 n=0
 def call(method,params=None):
  global n
  n+=1;i=n
  sock.send(json.dumps({"id":i,"method":method,"params":params or {}}))
  while True:
   e=json.loads(sock.recv())
   if e.get("id")==i:
    if "error" in e:raise RuntimeError(e["error"])
    return e.get("result",{})
 def ev(code):
  out=call("Runtime.evaluate",{"expression":code,"returnByValue":True,"awaitPromise":True})
  if "exceptionDetails" in out:print("EVAL_ERROR",str(out["exceptionDetails"])[:400])
  return out["result"].get("value")
 call("Page.enable");call("Runtime.enable")
 for lang in ("en","ar"):
  for width in (1300,390):
   call("Emulation.setDeviceMetricsOverride",{"width":width,"height":840,"deviceScaleFactor":1,"mobile":width==390})
   call("Page.navigate",{"url":"https://idea-dh.com/"})
   time.sleep(3)
   ev(f"localStorage.setItem('idea-language','{lang}');location.reload()")
   time.sleep(3)
   state=ev("""JSON.stringify({lang:document.documentElement.lang,dir:document.documentElement.dir,stored:localStorage.getItem('idea-language'),text:document.body.innerText.slice(0,210),arabicCount:(document.body.innerText.match(/[\u0600-\u06ff]/g)||[]).length,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,header:[...document.querySelectorAll('button')].filter(b=>['EN','AR','FR'].includes(b.textContent.trim())).map(b=>[b.textContent.trim(),b.style.color])})""")
   print("SITE_LOCALE",lang,width,state,flush=True)
 sock.close()
finally:proc.terminate()
