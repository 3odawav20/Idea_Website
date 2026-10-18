"""Recheck the rapid SPA-navigation outliers via independent direct page loads."""
import json
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

ROOT=Path(__file__).resolve().parent.parent
source=json.loads((ROOT/"reports/mobile-viewport-per-product.json").read_text(encoding="utf-8"))
by_slug={}
for viewport,data in source.items():
    for item in data["issues"]:
        if not item.get("routeMatched",False):
            by_slug[item["slug"]]={"slug":item["slug"],"expected":item["expected"]}
print("Direct navigation cases",len(by_slug),flush=True)
opts=Options()
opts.add_argument("--headless=new");opts.add_argument("--disable-gpu")
opts.page_load_strategy="eager"
driver=webdriver.Chrome(options=opts)
result=[]
try:
    for width,height in ((390,844),(320,700)):
        driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride",{"width":width,"height":height,"deviceScaleFactor":2,"mobile":True})
        for i,item in enumerate(by_slug.values(),1):
            try:
                driver.get("http://127.0.0.1:5174/product/"+item["slug"])
                WebDriverWait(driver,8).until(lambda browser:
                    (browser.execute_script("return document.querySelector('.idea-pd-grid h1')?.textContent?.trim()||''"))==item["expected"])
                metrics=driver.execute_script("return {screen:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,objectFit:getComputedStyle(document.querySelector('.idea-pd-grid img')).objectFit}")
                if metrics["overflow"]>3 or metrics["objectFit"]!="contain":result.append({"viewport":width,**item,"metrics":metrics})
            except Exception as ex:
                result.append({"viewport":width,**item,"error":str(ex)[:200]})
            if i%15==0:print("width",width,"checked",i,"/",len(by_slug),flush=True)
    target=ROOT/"reports/mobile-direct-route-recheck.json"
    target.write_text(json.dumps({"cases":len(by_slug),"widths":[390,320],"issues":result},indent=2),encoding="utf-8")
    print("DONE: direct route issues",len(result),flush=True)
finally:
    driver.quit()
