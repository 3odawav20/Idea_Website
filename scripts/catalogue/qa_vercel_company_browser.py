"""Chrome DevTools QA: public registration, mobile, private redirect."""
import base64,json,subprocess,time
from pathlib import Path
import requests,websocket
PORT=9347
BASE="https://idea-website-6dtv3uxta-abdelrahmanamr895-6118s-projects.vercel.app"
ROOT=Path(r"C:\Users\rakan\Desktop")
chrome=r"C:\Program Files\Google\Chrome\Application\chrome.exe"
process=subprocess.Popen([chrome,"--headless=new","--disable-gpu",
    "--no-first-run","--disable-extensions","--hide-scrollbars",
    "--remote-allow-origins=*","--window-size=1350,1040",
    "--remote-debugging-port="+str(PORT),
    "--user-data-dir="+str(ROOT / "idea_company_vercel_profile_20261103"),
    "about:blank"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
    for _ in range(55):
        try:
            pages=requests.get("http://127.0.0.1:"+str(PORT)+"/json",timeout=1).json()
            page=next(p for p in pages if p["type"]=="page")
            break
        except Exception:time.sleep(.22)
    else:raise RuntimeError("Chrome did not start")
    sock=websocket.create_connection(page["webSocketDebuggerUrl"],timeout=18,origin="http://localhost")
    counter=0
    def call(method,params=None):
        global counter
        counter+=1;ID=counter
        sock.send(json.dumps({"id":ID,"method":method,"params":params or {}}))
        while True:
            response=json.loads(sock.recv())
            if response.get("id")==ID:
                if response.get("error"):raise RuntimeError(response["error"])
                return response.get("result",{})
    call("Page.enable")
    call("Runtime.enable")
    checks=[
        ("/business/apply","business_application",False),
        ("/business/apply","business_application_mobile",True),
        ("/admin/companies","admin_anonymous_redirect",False),
        ("/products?q=IDEA-REF","product_search",False)
    ]
    for url,name,mobile in checks:
        if mobile:call("Emulation.setDeviceMetricsOverride",
            {"width":390,"height":844,"deviceScaleFactor":1,"mobile":True})
        else:call("Emulation.clearDeviceMetricsOverride")
        call("Page.navigate",{"url":BASE+url})
        time.sleep(2.8)
        js="""JSON.stringify({
          pathname:location.pathname,
          title:document.title,
          application:!!document.querySelector('.icc-apply'),
          companies:!!document.querySelector('.icc-root'),
          login:!!document.querySelector('input[type=password]'),
          scrollWidth:document.documentElement.scrollWidth,
          clientWidth:document.documentElement.clientWidth,
          ticker:!!document.querySelector('.idea-admin-ticker'),
          products:document.querySelectorAll('.idea-product-card').length,
          text:document.body.innerText.slice(0,220)
        })"""
        result=call("Runtime.evaluate",{"expression":js,"returnByValue":True})
        state=json.loads(result["result"]["value"])
        print("QA",name,json.dumps(state,ensure_ascii=False))
        if name=="business_application" or name=="business_application_mobile":
            assert state["application"], "Application did not render"
        if name=="admin_anonymous_redirect":
            assert state["pathname"]=="/login" and not state["companies"],"Anon saw admin"
        if name=="business_application_mobile":
            assert state["scrollWidth"] <= state["clientWidth"]+2,"Horizontal mobile overflow"
        image=call("Page.captureScreenshot",{"format":"png","captureBeyondViewport":False})
        dest=ROOT/("idea_vercel_qa_"+name+".png")
        dest.write_bytes(base64.b64decode(image["data"]))
        print("SCREENSHOT",dest.name,dest.stat().st_size)
    sock.close()
finally:
    process.terminate()
