import asyncio, sys, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8766/"
async def main():
  async with async_playwright() as pw:
    b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg = await b.new_page(viewport={"width":1440,"height":900}); errs=[]
    pg.on("pageerror", lambda e: errs.append("PAGEERR "+str(e))); pg.on("console", lambda m: m.type in ("error","warning") and errs.append(m.type+": "+m.text))
    await pg.goto(URL, wait_until="networkidle"); await pg.wait_for_timeout(3000)
    print(await pg.evaluate("({mode: Posts.mode, n: Posts.list.length, vp: !!window.VP, stats: window.VP && VP.stats(), webgl: !document.body.classList.contains('no-webgl')})"))
    await pg.screenshot(path=sys.argv[2] if len(sys.argv)>2 else "/tmp/vp-home.png")
    print("\n".join(errs[:15]))
    await b.close()
asyncio.run(main())
