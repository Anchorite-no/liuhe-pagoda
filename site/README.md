# 潮起六和 · Where the Tide Turns

《中国文化与国际传播》课程交互网站：以杭州**六和塔**与**钱江潮**为主题的中英双语 3D 学习网站。

## 网站结构

| 章 | 名称 | 核心交互 |
| --- | --- | --- |
| 序 | 八月十八 The Eighteenth Night | 滚动推进：夜转黎明，潮头沿江推过六和塔，镜头登上塔顶 |
| 一 | 之江 The River That Named Us | 钱塘江口 3D 沙盘、“之”字江道、之江大学与钱塘江大桥 |
| 二 | 镇潮 Why a Pagoda Here? | 钱王海塘迎潮、建塔、“六合 / 六和”两种解释、点亮塔灯为船指路、“镇潮”怎么译 |
| 三 | 造潮 Make a Tide | 潮汐实验室：月相、喇叭口、沙坎、风向，三种潮型，今日潮讯，观潮安全 |
| 四 | 明七暗六 Thirteen Outside, Seven Inside | 剥开清代木檐看南宋砖塔，朝代上色，剖切，逐层登塔，砖雕与梁思成 |
| 五 | 听潮 Listening to the Tide | 古诗文与译名实验室（潮信、弄潮儿、六和……） |
| 六 | 银龙 The Silver Dragon Meets the World | 3D 地球上的世界涌潮对比、国际冲浪赛、小测验 |
| 七 | 讲解员 Be the Guide | 3D 取景、英文讲解录音与反馈、词本、明信片生成 |

所有 3D 模型、材质和声音都由代码生成，没有使用外部图片、字体 CDN 或第三方接口，在国内网络环境下可以正常打开。

## 本地运行

需要 Node.js 18 及以上版本。

```bash
npm install
npm run dev
```

浏览器打开终端里显示的地址（默认 `http://localhost:5173`）。

单独调试某一章：`/dev.html?ch=ch3`（加 `&lang=zh` 以中文打开）。

## 打包发布

```bash
npm run build
```

生成的 `dist/` 文件夹就是完整网站，可以上传到任何静态网站托管（阿里云 OSS、腾讯云 COS、学校服务器、GitHub Pages 等）。本地预览打包结果：

```bash
npm run preview
```

注意：`dist/index.html` 不能直接双击用 `file://` 打开（浏览器会拦截模块脚本），需要通过上面的命令或任意静态服务器访问。

## 目录

```
site/
  index.html            整站入口
  dev.html              单章调试页
  src/main.js           页面框架：章节懒加载、导航、页脚
  src/core/             中英切换、UI 组件、词本、进度、程序化音效
  src/three/            3D：六和塔模型、钱塘江与潮头着色器、山水环境
  src/styles/           设计变量与通用组件样式
  src/chapters/chN-*/   各章内容（每章独立文件夹）
  docs/DEV_GUIDE.md     开发规范（接口、设计系统、完成标准）
```

## 说明

- 六和塔模型依据公开资料的比例（总高约 59.89 米、八角形平面、外檐 13 层、塔身 7 层“七明六暗”）程序化生成，属于教学示意模型，不是测绘图。
- 各章史实与数据的来源列在网站页脚“资料来源与说明”中；资料说法不一致的地方，正文已注明。
