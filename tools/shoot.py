"""Interaction test + screenshots for Viewport 3D. Needs ./serve.sh running (or pass a base URL).
   python3 tools/shoot.py [base_url]  -> screenshots/*.png and screenshots/share/*.jpg (top crop < 1600px)"""
import asyncio, sys
from PIL import Image
from playwright.async_api import async_playwright
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8766/").rstrip("/") + "/"
OUT = "screenshots"
ARGS = ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
def share(png, name):
  im = Image.open(png).convert("RGB"); im = im.crop((0, 0, im.width, min(im.height, 1590)))
  im.save(f"{OUT}/share/{name}.jpg", quality=86, optimize=True)
async def main():
  async with async_playwright() as pw:
    b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=ARGS)
    pg = await b.new_page(viewport={"width": 1440, "height": 900}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    ok = lambda c, m: print(("PASS " if c else "FAIL ") + m)
    await pg.goto(BASE, wait_until="networkidle"); await pg.wait_for_timeout(2500)
    st = await pg.evaluate("({mode:Posts.mode,n:Posts.list.length,e:VP.stats().essays})"); ok(st["mode"] == "live" and st["n"] > 100, f"live posts {st}")
    await pg.screenshot(path=f"{OUT}/01-home.png"); share(f"{OUT}/01-home.png", "01-home")
    # orbit (drag), zoom (wheel), pan (right drag): camera must move
    cam0 = await pg.evaluate("VP._debug.camera.position.toArray()")
    await pg.mouse.move(700, 400); await pg.mouse.down(); await pg.mouse.move(820, 360, steps=8); await pg.mouse.up()
    await pg.mouse.wheel(0, -400); await pg.wait_for_timeout(400)
    await pg.mouse.move(700, 400); await pg.mouse.down(button="right"); await pg.mouse.move(660, 430, steps=6); await pg.mouse.up(button="right"); await pg.wait_for_timeout(500)
    cam1 = await pg.evaluate("VP._debug.camera.position.toArray()"); ok(cam0 != cam1, "orbit/zoom/pan moved the camera")
    await pg.keyboard.press("h"); await pg.wait_for_timeout(1500)
    await pg.screenshot(path=f"{OUT}/02-home-orbited.png")
    # hover + click an essay block in the 3D scene -> essay route
    pt = await pg.evaluate("(()=>{const s=VP.screenOf('essay','a-new-kinetic-computing-platform');const r=document.querySelector('#vp-main').getBoundingClientRect();return s&&{x:r.left+s.x,y:r.top+s.y+8}})()")
    if pt:
      await pg.mouse.move(pt["x"], pt["y"]); await pg.wait_for_timeout(300)
      tip = await pg.evaluate("document.querySelector('#tip').hidden ? '' : document.querySelector('#tip').textContent"); ok(bool(tip), f"hover tooltip: {tip[:60]}")
      await pg.mouse.click(pt["x"], pt["y"]); await pg.wait_for_timeout(1800)
      h = await pg.evaluate("location.hash"); ok(h.startswith("#/post/"), f"3D click opened {h}")
    # click a theme marker in 3D -> theme filter
    await pg.goto(BASE + "#/", wait_until="networkidle"); await pg.wait_for_timeout(2500)
    pt = await pg.evaluate("(()=>{const s=VP.screenOf('theme','games');const r=document.querySelector('#vp-main').getBoundingClientRect();return s&&{x:r.left+s.x,y:r.top+s.y+12}})()")
    if pt: await pg.mouse.click(pt["x"], pt["y"]); await pg.wait_for_timeout(1500)
    ok("games" in await pg.evaluate("location.hash"), "3D theme click -> " + await pg.evaluate("location.hash"))
    # writing index
    await pg.goto(BASE + "#/blog", wait_until="networkidle"); await pg.wait_for_timeout(2500)
    await pg.screenshot(path=f"{OUT}/03-writing.png"); share(f"{OUT}/03-writing.png", "02-writing")
    # theme via outliner, then search typed in the top bar
    await pg.click(".tree a[data-set-theme=robotics]"); await pg.wait_for_timeout(1500)
    n = await pg.evaluate("document.querySelectorAll('#results a[data-slug]').length"); ok(n > 3, f"outliner theme robotics -> {n} results, hash {await pg.evaluate('location.hash')}")
    await pg.screenshot(path=f"{OUT}/04-theme-robotics.png"); share(f"{OUT}/04-theme-robotics.png", "03-theme-robotics")
    await pg.click(".tree a[data-set-theme=all]"); await pg.wait_for_timeout(500)
    await pg.keyboard.press("/"); await pg.keyboard.type("engine", delay=40); await pg.wait_for_timeout(900)
    h = await pg.evaluate("location.hash"); n = await pg.evaluate("document.querySelectorAll('#results a[data-slug]').length"); ok("q=engine" in h and n > 0, f"search engine -> {n} results, {h}")
    await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("j"); await pg.wait_for_timeout(1500)
    await pg.screenshot(path=f"{OUT}/05-search-engine.png"); share(f"{OUT}/05-search-engine.png", "04-search-engine")
    await pg.keyboard.press("Enter"); await pg.wait_for_timeout(2000)
    h1 = await pg.evaluate("location.hash"); ok(h1.startswith("#/post/"), f"Enter opened {h1}")
    await pg.keyboard.press("ArrowLeft"); await pg.wait_for_timeout(1500); h2 = await pg.evaluate("location.hash"); ok(h2 != h1, f"ArrowLeft -> {h2}")
    await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(1500); ok(await pg.evaluate("location.hash") == h1, "ArrowRight back")
    # essay deep link
    await pg.goto("about:blank"); await pg.goto(BASE + "#/post/a-love-letter-to-the-commodore-64", wait_until="networkidle"); await pg.wait_for_timeout(3000)
    w = await pg.evaluate("(()=>{const p=document.querySelector('.prose p');const cs=getComputedStyle(p);const c=document.createElement('canvas').getContext('2d');c.font=cs.fontSize+' '+cs.fontFamily;return [p.clientWidth,cs.fontSize,Math.round(p.clientWidth/c.measureText('0').width)]})()")
    ok(60 <= w[2] <= 76, f"essay measure {w}")
    await pg.screenshot(path=f"{OUT}/06-essay.png"); share(f"{OUT}/06-essay.png", "05-essay")
    await pg.goto("about:blank"); await pg.goto(BASE + "#/cv", wait_until="networkidle"); await pg.wait_for_timeout(2000)
    await pg.screenshot(path=f"{OUT}/07-cv.png"); share(f"{OUT}/07-cv.png", "06-cv")
    await pg.goto(BASE + "?notes=1#/cv", wait_until="networkidle"); await pg.wait_for_timeout(2000)
    ok(await pg.evaluate("document.querySelectorAll('.src').length") > 10, "cv ?notes=1 shows sources")
    await pg.goto("about:blank"); await pg.goto(BASE + "#/books", wait_until="networkidle"); await pg.wait_for_timeout(2500)
    await pg.screenshot(path=f"{OUT}/08-books.png"); share(f"{OUT}/08-books.png", "07-books")
    links = await pg.evaluate("[...document.querySelectorAll('.buy a')].map(a=>a.href)"); ok(len(links) >= 3, f"buy links {links}")
    # snapshot fallback
    await pg.goto(BASE + "?offline=1#/blog?theme=games", wait_until="networkidle"); await pg.wait_for_timeout(2500)
    st = await pg.evaluate("({mode:Posts.mode,n:document.querySelectorAll('#results a[data-slug]').length,badge:document.querySelector('#status').textContent})"); ok(st["mode"] == "snapshot" and st["n"] > 3, f"offline -> {st}")
    await pg.route("**/public.api.paragraph.com/**", lambda r: r.abort())
    await pg.goto(BASE + "#/blog", wait_until="networkidle"); await pg.wait_for_timeout(3000)
    st = await pg.evaluate("({mode:Posts.mode,detail:Posts.detail,n:Posts.list.length})"); ok(st["mode"] == "snapshot", f"API blocked -> {st}")
    await pg.unroute("**/public.api.paragraph.com/**")
    # mobile
    m = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    await m.goto(BASE, wait_until="networkidle"); await m.wait_for_timeout(3000)
    await m.screenshot(path=f"{OUT}/09-mobile-home.png", full_page=True)
    await m.goto(BASE + "#/post/a-new-kinetic-computing-platform", wait_until="networkidle"); await m.wait_for_timeout(3000)
    await m.screenshot(path=f"{OUT}/10-mobile-essay.png", full_page=True)
    ok(not await m.evaluate("document.documentElement.scrollWidth > innerWidth + 1"), "mobile no horizontal overflow")
    print("errors:", errs[:10])
    await b.close()
asyncio.run(main())
