#!/usr/bin/env python3
"""Browser-level mobile viewport QA for every published Art Ceramic product route.
Runs against LOCAL Vite preview, not the actual iPhone or the production domain.
Requires Selenium 4 and a Chrome/Chromium browser. Writes a JSON per-viewport report.
"""
import json
import sys
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT=Path(__file__).resolve().parent.parent
DATA=json.loads((ROOT/"src/app/data/artceramic.json").read_text(encoding="utf-8"))
BASE=sys.argv[1] if len(sys.argv)>1 else "http://127.0.0.1:5174"
opts=Options()
opts.add_argument("--headless=new")
opts.add_argument("--disable-gpu")
opts.add_argument("--disable-extensions")
opts.add_argument("--no-first-run")
opts.add_argument("--no-default-browser-check")
opts.add_argument("--window-size=430,900")
driver=webdriver.Chrome(options=opts)
driver.set_script_timeout(230)
started=time.time()
summary={}
try:
    driver.get(BASE+"/product/"+DATA[0]["slug"])
    time.sleep(2)
    print("Title",driver.title,"body",len(driver.page_source),flush=True)
    for width,height,name in [(390,844,"iPhone_390_chrome_emulation"),(360,800,"Android_360_chrome_emulation"),(320,700,"small_phone_320_chrome_emulation"),(768,1024,"tablet_768_chrome_emulation")]:
        driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride",{
            "width":width,"height":height,"deviceScaleFactor":2,
            "mobile":True,"screenWidth":width,"screenHeight":height,
        })
        time.sleep(.6)
        issues=driver.execute_async_script(r"""
        const products=arguments[0], done=arguments[arguments.length-1];
        (async()=>{
          let errors=[];
          const pause=ms=>new Promise(r=>setTimeout(r,ms));
          for(let index=0;index<products.length;index++){
            const p=products[index];
            history.pushState({}, "", "/product/"+encodeURIComponent(p.slug));
            dispatchEvent(new PopStateEvent("popstate"));
            let heading="";
            let found=false;
            for(let n=0;n<16;n++){
              await pause(25);
              heading=(document.querySelector(".idea-pd-grid h1")?.textContent||"").trim();
              if(heading===p.name){found=true;break;}
            }
            const docWidth=document.documentElement.scrollWidth;
            const viewport=window.innerWidth;
            const image=document.querySelector(".idea-pd-grid img.idea-vivid-image");
            const grid=document.querySelector(".idea-pd-grid");
            const gridColumns=grid?getComputedStyle(grid).gridTemplateColumns:"";
            const imgStyle=image?getComputedStyle(image):null;
            if(!found||!image||docWidth>viewport+3||(!imgStyle||imgStyle.objectFit!=="contain")){
              errors.push({id:p.id,slug:p.slug,expected:p.name,actual:heading,
                horizontalOverflow:Math.max(0,docWidth-viewport),viewport,
                imageFound:!!image,imageObjectFit:imgStyle?.objectFit,
                gridColumns,routeMatched:found});
            }
            if(index%100===99)console.log("Audited",index+1);
          }
          done(errors);
        })().catch(e=>done([{error:String(e)}]));
        """, [{"id":str(x["id"]),"slug":x["slug"],"name":x["name"]} for x in DATA])
        summary[name]={"checked":len(DATA),"issue_count":len(issues),"issues":issues}
        print(name, "tested",len(DATA),"issues",len(issues),"seconds",round(time.time()-started,1),flush=True)
        if issues:print("first examples",json.dumps(issues[:5],ensure_ascii=False),flush=True)
        if name=="iPhone_390_chrome_emulation":
            driver.get(BASE+"/product/"+DATA[0]["slug"])
            time.sleep(1)
            driver.save_screenshot(str(ROOT/"reports"/"mobile-product-390.png"))
    (ROOT/"reports").mkdir(exist_ok=True)
    (ROOT/"reports"/"mobile-viewport-per-product.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
finally:
    driver.quit()
