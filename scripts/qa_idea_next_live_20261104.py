from pathlib import Path
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait

BASE="https://idea-dh.com/idea-next"
shots=Path("C:/Users/rakan/Desktop/IDEA_Company_Control_20261103")
o=Options();o.add_argument("--headless=new");o.add_argument("--window-size=1450,950")
o.add_argument("--enable-webgl");o.add_argument("--use-gl=angle");o.add_argument("--use-angle=swiftshader")
o.add_argument("--disable-gpu-sandbox");o.add_argument("--no-sandbox")
o.set_capability("goog:loggingPrefs",{"browser":"ALL"})
d=webdriver.Chrome(options=o)
try:
 d.set_page_load_timeout(35)
 d.get(BASE+"/room-designer/3d")
 WebDriverWait(d,25).until(lambda x: x.find_elements(By.CSS_SELECTOR,".idea-room3d-stage canvas"))
 time.sleep(2)
 print("3D_LIVE_URL",d.current_url)
 print("3D_CANVAS",len(d.find_elements(By.CSS_SELECTOR,".idea-room3d-stage canvas")))
 print("WEBGL_CONTEXT",d.execute_script("let x=document.querySelector('.idea-room3d-stage canvas');return !!(x&&(x.getContext('webgl2')||x.getContext('webgl')))"))
 print("INITIAL_FIXTURES",len(d.find_elements(By.CSS_SELECTOR,".idea-room3d-placed button")))
 d.save_screenshot(str(shots/"idea_3d_live_preview.png"))
 # Place bathtub from generic shapes, then choose top view and a wall.
 d.find_element(By.XPATH,"//button[contains(.,'Bathtub')]").click()
 time.sleep(.6)
 print("AFTER_ADD",len(d.find_elements(By.CSS_SELECTOR,".idea-room3d-placed button")))
 d.find_element(By.XPATH,"//button[normalize-space()='Top']").click()
 print("TOP_CAMERA_LABEL",d.find_element(By.CSS_SELECTOR,".idea-room3d-overlay").text[:65])
 d.find_element(By.XPATH,"//button[normalize-space()='Back wall']").click()
 print("SURFACE_SELECTED",d.find_element(By.CSS_SELECTOR,".idea-room3d-pills button.active").text[:80])
 d.save_screenshot(str(shots/"idea_3d_live_top.png"))
 d.get(BASE+"/tile-showroom")
 WebDriverWait(d,25).until(lambda x: x.find_elements(By.CSS_SELECTOR,".idea-raw-grid img"))
 print("TILE_LIVE_URL",d.current_url)
 print("TILE_HEADER",d.find_element(By.CSS_SELECTOR,".idea-raw-header h1").text)
 print("TILE_CARDS",len(d.find_elements(By.CSS_SELECTOR,".idea-raw-grid .idea-raw-card")))
 print("FIRST_TILE",d.find_element(By.CSS_SELECTOR,".idea-raw-card-info").text[:100])
 print("STAGED_ROOM_SRC",sum(1 for el in d.find_elements(By.CSS_SELECTOR,".idea-raw-showroom img") if "unsplash" in (el.get_attribute("src") or "").lower()))
 d.save_screenshot(str(shots/"idea_tile_live_preview.png"))
 d.set_window_size(390,840)
 d.refresh()
 WebDriverWait(d,25).until(lambda x: x.find_elements(By.CSS_SELECTOR,".idea-raw-grid .idea-raw-card"))
 print("MOBILE_HORIZONTAL_OVERFLOW",d.execute_script("return document.documentElement.scrollWidth>window.innerWidth"))
 print("SEVERE_ERRORS",[x["message"][:180] for x in d.get_log("browser") if x["level"]=="SEVERE"][:8])
finally:
 d.quit()
