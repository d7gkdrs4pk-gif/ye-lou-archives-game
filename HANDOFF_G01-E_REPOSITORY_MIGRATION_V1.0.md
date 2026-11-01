# 《夜楼档案》｜独立仓库迁移交接单 V1.0

日期：2026-11-01。**本交接单记录 GitHub 仓库复制迁移，不升级游戏版本。**

## 一、目标与范围
- 源仓库：[roompath-game](https://github.com/d7gkdrs4pk-gif/roompath-game)；冻结读取基线 `8f4a96774a38b5c417969b51386c046be351f33b`。
- 新仓库：[ye-lou-archives-game](https://github.com/d7gkdrs4pk-gif/ye-lou-archives-game)；Public，独立 `main`，仅保留《夜楼档案》及必要原20关游戏资料。
- **禁止范围：** 不搬 `wanxiang-cloud-kyoto-p01.html`、`wanxiang-cloud-kyoto-postcard-p051.html` 或其他项目源码；不转移旧仓库失败的部署修复工作流；不删除/改写旧仓库，不重制剧情、美术、机关和玩家数据。
- 不迁移旧仓库全部历史实验页面；老历史资料在源仓库可追溯。新仓库只把 V0.9.2、回退版本、已冻结美术参考及必要静态入口和依赖带入当前执行链。

## 二、唯一正式工作母版与回退
- **现行 G01-E 试玩母版：** `ye-lou-act2-puzzle-v092.html`，SHA-256 `7135e0b820ae02a67006ec0d4dcb6cd9a46dc9a3a71807ad99a2649149cf7731`；源/目标 Git Blob 均为 `b4c5bdc28bb785a2569324aa57bd580a8a055876`。仅作为研发试玩，尚未冻结商业版。
- **G01-E 回退：** `ye-lou-act2-puzzle-v091.html`，Git Blob `11775607dc78a2ff8afda5f7d80d2be215d324cd`，SHA-256 `5757bb07084d9b588d456832a55d0d82b31ae364715ba0e24c33046eda28e398`。
- **漫画2.5D冻结视觉母版：** `ye-lou-act1-comic-v082.html`，Git Blob `f4ceeb59caf333161e6938e940b0717d3e93e221`。
- **第二幕原机关 JS：** `act2-workshop-v090.js`，Git Blob `8efc304900e25d82889369408c89545aa0715e70`。不修改谜题及已有存档键。
- **G01 原20关/60星主游戏：** `index.html`，保留原游戏功能；在新副本内只更换新仓库分享网址及章节入口。源文件原样保留旧仓库作为可追溯基线。

## 三、实际迁移明细与必要适配
**逐字节 Git Blob 保持一致的运行/历史资料：**
`ye-lou-act2-puzzle-v092.html`、`ye-lou-act2-puzzle-v091.html`、`ye-lou-act1-comic-v082.html`、`act2-workshop-v090.js`、`chapter-one.html`、`story-lab.html`、`leaderboard.js`、`visual-25d.html`。

**原20关入口的迁移路径适配（非游戏逻辑改造）：**
- `index.html`：海报分享链接及海报显示网址由旧仓库路径改为 `/ye-lou-archives-game/`；唯一悬疑章节入口由旧 `./chapter-one.html?v=0.2` 改为 `./ye-lou-act2-puzzle-v092.html?v=0.9.2`。仅 3 处字符串替换；源 Git Blob `6527bf699df1a3714de82c2eb64bc0d8cc0d3a2f`，目标 Git Blob `49651e6204fa174d370c3da21c5c9e1fdb03e93e`。
- `share-poster.js`：仅更新 2 处旧仓库分享目标字符串，源 Git Blob `e94e0cf2f4f228e0f8a7754fbcaeb0a6a3978f61`，目标 Git Blob `2f485c7fd1d019a8cf5a7f17cc92616619646910`。
- V0.9.2 的分享 URL 由运行时 `location.origin + location.pathname` 生成，迁移后无需改其游戏文件。
- `tests/g01-e-v092-regression.py`（Blob `3a0ac6f369d09d7e45ba3ba2b3c9bc9fc5b2c876`）、`tests/g01-e-v092-act2.py`（Blob `a781710fc9c922679221de2610c039e0174b5cbf`）原样复制。
- `.agents/skills/frontend-design/SKILL.md`（Blob `a5333457c414d20d625f307df945842c0952ecc3`）、`LICENSE.txt`（Blob `f433b1a53f5b830a205fd2df78e2b34974656c7b`）原样复制，继续遵守 Apache-2.0。
- 两份 G01-E 历史交接单、两份 Skill 接入交接单原样保留；本交接单为新仓库唯一当前迁移交接。
- 仅新仓库重定制 `PROJECT_STATUS.md`，以本交接单为当前指针；原仓库仍保持原样。
- 增加 `.nojekyll`，声明原样静态文件发布，不修改 HTML 内容。

## 四、测试与发布准入
- 迁移前 V0.9.2：5 档视口针对性 Chromium 回归 **292/292**；第二幕完整页面机关回归 **45/45**；11 个脚本语法检查通过；这是**原仓库修复验收**，不能代替新公网页面与真实 iPhone 验收。
- 本轮只依据源/目标 Git Blob 相等和复制清单证明文件一致；`index.html` 和 `share-poster.js` 的例外均已记录逐字替换范围。
- **GitHub Pages：** 新仓库创建时 Pages 尚未启用。需要设置 `Settings → Pages → Build and deployment → Deploy from a branch → main / (root)`，再检查 Actions 状态、站点 HTTPS 返回 200、HTML 版本、第二幕 JS 及浏览器实际加载。
- **计划试玩地址（未验收前不宣称上线）：** `https://d7gkdrs4pk-gif.github.io/ye-lou-archives-game/ye-lou-act2-puzzle-v092.html?v=0.9.2`。
- 新旧 Pages 项目页同属 `https://d7gkdrs4pk-gif.github.io` 这一 origin；在**同一浏览器、同一存储分区**下，`localStorage` 通常依 origin 共用，保存键没有改。但不得假定 Safari / 微信之间自动同步存档，更不得未经真机验证就宣称用户进度已迁移。
- 微信分享/图片海报、Safari 跨幕与触控、实际连通与刷新恢复均待新站真机验收。

## 五、冻结与下一轮唯一任务
- 冻结六幕漫画化 2.5D 深蓝建筑/粉紫霓虹、大字号故事卡、剧情分支、两室机关、档案/奖励/排名/分享、旧存档键和 20关/60星机制。
- **下一轮唯一任务：** 打开新仓库 Pages，成功后核验公网页面及资源，再开展 iPhone Safari/微信验收。发布失败则保留本母版和证据，局部排障，不重新制作代码。
- 唯一入口：本交接单 + 新仓库 `PROJECT_STATUS.md`。源仓库作为完整历史备份，历史文件不参与正常执行。
