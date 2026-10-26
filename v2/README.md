# 六和塔 · Liuhe Pagoda（v2）

浙江大学《中国文化与国际传播》课程作业：一个讲六和塔的交互学习网站。中文为主，可整站切换成英文。

整页是一张宣纸，纸上铺满细小的字符，像像素一样（做法参考 ZJU Run 登录页的字符画球场）：每个字符格子都“看”向一片透视的江面，按看到的墨色浓淡选字。江面用水墨画浪的办法画出一道道浪线；每隔二十多秒，一道潮头（一线潮）从天边推过来，越推越高，涌到眼前时是一堵深色的水墙，顶上一道白色的浪花，浪花上溅起水沫，潮头后面的江水翻着白沫。鼠标附近的字会被打乱、抖动，点一下江面会荡开一圈圈涟漪；往下翻页时，江水流得快一些。可以随时拖动旋转的实时三维塔立在这片字符上，影子也落在上面；左边是中英对照的讲解卡片。

## 内容结构

八章，每张卡片都是中英对照；大多数卡片下面有“细读 Read more”，折起来的是更长的讲解；章与章之间插着整屏的真实照片。

| 章 | 标题 | 右边的画面 | 可以做什么 |
| --- | --- | --- | --- |
| 壹 | 初见 First Sight | 实时三维：整塔慢转 → 屋檐近景（带标注）→ 斗拱 → 远景 | 起风听风铎；点塔上不同高度的屋檐，铃声高低不同 |
| | *照片长廊：真实的六和塔* | 横向滑过的 10 张实景照片 | 点开放大 |
| 贰 | 缘起 Why a Pagoda Here | 潮头从塔下涌过、夜里塔顶点灯（渲染视频）→ 字符江面 | 传说“六和填江”：点江面投七块石头，江水真的平下来 |
| 叁 | 屡毁屡修 Burned and Rebuilt | 实时三维：三个朝代的标注 → 时光机 | 拖动 970—2026 年：外檐被烧掉（溶解、火星）又重建，老照片随年份出现；梁思成复原方案和 1991 年“整旧如旧”二选一，看两边的理由 |
| 肆 | 拆开看 Take It Apart | 实时三维：七明六暗 → 一层檐分层 → 剖开双筒；塔内壶门（渲染图） | 斗拱拼装游戏（全屏三维）；全屏自己拆 |
| 伍 | 登塔 Climb the Seven Floors | 实时三维：镜头沿塔一层层盘旋上升 | 七块乾隆题匾（古匾从右往左读，第一个字就是层数），每层配实景照片 |
| | *整屏：周密《观潮》* | 一线潮照片推近，原文和英译逐字浮现 | |
| 陆 | 听潮 Listening to the Tide（整章转为夜色） | 渲染视频 → 字符江面 | 潮汐实验室（拖月亮、选农历八月、开关沙坎，看潮头沿杭州湾涨高）；弄潮儿游戏（全屏） |
| | *照片长廊：八月十八 / 世界怎样看六和塔* | 潮水实景；1891—1987 年中外拍摄的老照片 | |
| 柒 | 讲给世界听 Telling the World | 实时三维 | 译名工坊（六个词，各三种译法，点评音译/意译）；当一回导游（拼讲解词，浏览器朗读，跟读） |
| 捌 | 练一练 Practice | 实时三维慢转 | 14 道小题；生成登塔证书 |

一路上做九件事各得一枚印章（右上角“印”），正好是 970 年那座塔的九级；印章册里写上名字可以生成一张登塔证书（PNG）。进度只存在读者自己的浏览器里（localStorage），没有也不影响使用。

三维模型的操作：任何时候都能拖动旋转；按住 Ctrl 滚轮或触控板双指缩放，或者用右下角的 ＋ − ⟲；“全屏探索”进入自由模式，滚轮直接缩放，左边有拆解滑块和五个步骤按钮，点构件可以看中英文介绍。普通滚轮留给翻页，所以不按 Ctrl 时滚轮不会缩放模型。

声音全部用 Web Audio 现场合成，不下载音频文件：风铎、木头碰撞、盖章、火声、鼓声、潮声；右上角“江声”打开背景江水声。朗读用浏览器自带的语音（Web Speech API），浏览器没有对应语音时朗读按钮不显示。

## 真实照片

41 张照片都来自维基共享资源（Wikimedia Commons），是公有领域或知识共享 CC BY / CC BY-SA 授权；每张照片下面、灯箱里和页脚都写了作者、授权和原始页面链接。`v2/tools/photos.py` 负责下载和转换：

```bash
cd v2/tools
python photos.py      # 下载到 tools/.photo-cache（不入库），转成 web/public/media/photos/*.webp，写出 web/src/photo-credits.js
```

图注在 `web/src/photos.js`。维基对下载限速很严，脚本会自动等待重试，第二次运行只做转换。

## 运行

需要 Node.js 18 以上。

```bash
cd v2/web
npm install
npm run dev        # 开发：http://127.0.0.1:5173
npm run build      # 打包到 v2/web/dist
npm run preview    # 本地预览打包结果
```

## 部署

`npm run build` 生成的 `v2/web/dist` 是纯静态网站，整个文件夹上传到任何静态托管即可。路径都是相对路径（`base: './'`），放在子目录里也能用。

- 总大小约 23 MB：三维模型约 3.5 MB，五段循环视频每段 1–3 MB（读到那一步才下载），41 张照片共约 8 MB（滚到附近才加载），代码约 0.3 MB（gzip 后；两个游戏各自单独打包，点开才下载），字体约 0.6 MB。三维模型打开页面就开始加载，封面上会显示进度。
- 网站不需要后端，也不需要 GPU：三维、字符背景、视频都在读者的浏览器里运行，服务器只发文件。真正要看的是服务器带宽。
- 不再用到麦克风，http 也能完整使用；有域名的话仍建议上 HTTPS。

## 目录

```
v2/
  blender/            Blender 5.2 无界面脚本（./run.sh 脚本名 参数…）
    lib/pagoda.py       塔的模型：13 层木构外檐 + 7 层砖塔身 + 塔刹 + 台基
    lib/explode.py      机械式拆解的参数和时间线（网页 viewer.js 里有同样的一份）
    lib/env.py          月轮山、树林、天空，把下面两个组合起来
    lib/water.py        钱塘江：Ocean 修改器做的真实波浪和泡沫，潮头（一线潮）
    lib/site.py         塔下的石台、栏杆、粉墙黛瓦、山门、石阶、江边马路、路灯、观潮的人
    build.py            建模，存成 out/pagoda.blend
    render.py           静帧（hero 用环境变量定太阳、镜头、潮头位置，见下）
    interior.py / night.py   塔内壶门、夜景塔灯
    anim3.py            旧的拆解影片（网站已改用实时模型，脚本保留）
    clip.py             会动的画面：在 render.py / night.py 的场景上加动画，渲染成帧
    export.py           导出网页用的 out/pagoda.glb（含剖开的副本）
  tools/media.py      把用到的渲染图转成 webp，复制模型
  tools/loop.py       把渲染出的短片首尾淡接成无缝循环，编码成 mp4（需要 ffmpeg）
  tools/subset_fonts.py  把中文字体裁到网站用到的字（打包前自动运行）
  tools/photos.py     从维基共享资源下载真实照片，转成 webp，写出作者和授权
  web/                Vite + three.js + GSAP 网站
    src/content.js      全部讲解文字（中英）：章节、细读、时光机年表、乾隆七匾、译名和导游题、小测、照片插页
    src/main.js         页面骨架、滚动动效（GSAP + Lenis）、全屏探索、夜色、游戏入口
    src/viewer.js       实时三维模型、拆解、标注、缩放、外檐烧毁和重建（时光机）、登塔镜头
    src/ascii.js        字符江潮（背景）：透视江面、潮头、选字着色器、鼠标交互、投石平潮、夜色
    src/widgets.js      卡片里的互动：风铎、投石、时光机、复原之争、题匾、译名工坊、导游词、游戏入口
    src/tidelab.js      潮汐实验室：月相、喇叭口、沙坎
    src/dougong.js      斗拱拼装游戏（自带一个小三维场景）
    src/rider.js        弄潮儿游戏（Canvas 水墨风）
    src/passport.js     印章册和登塔证书
    src/interludes.js   章与章之间的整屏照片：横向长廊、观潮整屏
    src/photos.js       照片图注、署名、灯箱；photo-credits.js 由 tools/photos.py 生成
    src/sound.js        Web Audio 合成的声音
    src/speak.js        浏览器朗读（Web Speech API）
    src/callouts.js     引线标注
    src/learn.js        练一练的小测
    src/style.css / features.css
```

## 改内容

- **文字**：只改 `web/src/content.js`。每一步都有 `zh` 和 `en`；`view` 指定右边三维模型的状态（whole / eave / brackets / far / history / open / groups / layers / cut / floor0–floor7 / practice，river 表示不显示塔），`image` 指定渲染图，`labels` 是这一步的标注；`more` 是折起来的细读，`photo` 是卡片里的照片，`widget` 是卡片里的互动。
- **中文字体**：思源宋体（Noto Serif SC）只保留网站上用到的字，每个字重一个约 210 KB 的文件（`web/src/fonts/`）。`npm run build` 会先自动重新裁一遍；开发时加了新字，跑 `npm run fonts` 即可（需要 Python 和 fontTools）。没裁进去的字会用系统字体显示。
- **拆解的距离和节奏**：改 `web/src/viewer.js` 开头那几个数；如果还要重新渲染静帧，`blender/lib/explode.py` 里同名的数也改成一样。
- **字符江潮**：`web/src/ascii.js` 开头的 `HORIZON`（江天线位置）、`BORE_PERIOD` / `BORE_RUN`（潮头多久来一次、走多久），着色器里的 `swell`（浪）和潮头的高度 `hb`；`CHARS` 是从疏到密的选字表。

## 重新生成画面

全部在 `v2/blender` 下执行（Windows 上用 Git Bash）。

```bash
./run.sh build.py                                  # 建模，约 20 秒
./run.sh export.py                                 # 网页模型
./run.sh night.py out/night.png 256 2000 1250
./run.sh interior.py out/interior.png 512 1600 1500
cd ../tools && python media.py                     # 转成网页素材

# 五段会动的画面（江水在动、日光在江面上闪、云影掠过、潮头翻滚溅沫、灯笼闪烁、镜头轻轻晃），每段约 30–40 分钟
# 白天两段都是迎着早晨低斜的太阳拍：太阳在画面里，江面上有一条日光的反光带，潮头逆光透亮。
# 太阳、镜头、潮头位置写在 clip.py 的 SHOTS / NIGHTS 里（SUN_EL 高度角、SUN_ROT 方位角、CAM "相机;目标;焦距"、BORE 潮头 x；夜景用 MOON_EL / MOON_ROT）
cd ../blender
./run.sh clip.py tide   out/clips/tide   64 1600 1200
./run.sh clip.py listen out/clips/listen 64 1600 1200
./run.sh clip.py night  out/clips/night  64 1600 1200
./run.sh clip.py crest     out/clips/crest     64 1600 1200   # 长焦看潮头（弄潮儿）
./run.sh clip.py nighttide out/clips/nighttide 64 1600 1200   # 夜里从山上看塔、月光和夜潮（鲁智深听潮）
cd ../tools && for n in tide listen night crest nighttide; do python loop.py $n; done   # 首尾淡接成无缝循环，编码成 mp4，首帧存成 webp（要在 media.py 之后跑，media.py 会清掉 mp4）
```

## 上交前请核对

- 模型是依据公开资料和照片做的**教学示意**，不是测绘图：门和壁龛的位置、斗拱的形式、各层尺寸都是示意。页面上已经说明。
- 史实已尽量对照资料（见网页底部“资料来源”），以下几处各书说法不一，网页里写得比较保守：南宋重建的起止年份；“六和”的两种解释；须弥座砖雕的数量（170 多组到 200 多处）。
- “暗层封闭”“斗拱把屋檐的重量传给柱子”是按一般砖身木檐塔的构造来写的；如果课程资料对六和塔外檐的具体做法有更准确的说法，改 `content.js` 和 `labels.js` 即可。
- 新加的内容里，这几处也是各家说法不一或只有一般来源，网页写得比较保守：乾隆七块匾的个别字（“五云扶盖/覆盖”“六鳌负戴/负载”“四天宝纲/宝网”）和题匾年份；外檐历次被焚（1533 年倭寇、1861 年太平天国战争）和 1735、1900 年重建的年份（依维基百科六和塔条目）；“六和填江”“钱王射潮”是民间故事；钱塘江大桥“预留炸药孔”是流传的说法；潮汐实验室和潮头高度、速度只是按比例示意。
- 斗拱拼装游戏是简化的宋式斗拱（栌斗、泥道拱、华拱、散斗、齐心斗、交互斗、柱头枋、令拱、耍头、撩檐枋），用来讲受力的道理，不是六和塔外檐斗拱的实测。
