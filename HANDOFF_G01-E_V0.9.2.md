# 《夜楼档案》G01-E 阶段交接单｜V0.9.2

日期：2026-11-01。状态：**用户批准，PR #2 已合并 main；源码/构建核验通过，GitHub Pages 部署出现并发冲突，失败作业已发起一次重试（结果待核验）；真实 iPhone Safari/微信仍未验收。**
本批仅修复跨幕滚动位置与 320px 顶栏装饰层点击遮挡，不是视觉改版或玩法升级。

## 1. 当前成果、提交与回退

- 仓库：`d7gkdrs4pk-gif/roompath-game`。
- 分支：`fix/g01-e-v092-scroll-and-topbar`，从最新 main `da9b55bdced2e9f6645807c9aec1e82493db75e0` 创建；main 中已有的无关页面保持原样，不进入本批改动。
- G01-E 当前 `main` 唯一研发试玩工作母版：`ye-lou-act2-puzzle-v092.html`，V0.9.2；**已合并源码，但官网发布未确认**。
- 候选 SHA-256：`7135e0b820ae02a67006ec0d4dcb6cd9a46dc9a3a71807ad99a2649149cf7731`。
- 候选 Git Blob：`b4c5bdc28bb785a2569324aa57bd580a8a055876`。
- 实现及回归脚本提交：`7c3be4ad5c770dc60820fd0a393608f27a41c0de`。管理记录随本文件所在提交更新；最终 HEAD 以对应 PR 为准，避免将文档自身提交 SHA 写成自引用。
- PR：[#2 V0.9.2 定点修复](https://github.com/d7gkdrs4pk-gif/roompath-game/pull/2)，已 Closed/Merged；合并提交 `367f024a1814fef824320187e3e72efbacd0c2d9`。
- 当前源码：[main 的 V0.9.2 文件](https://github.com/d7gkdrs4pk-gif/roompath-game/blob/main/ye-lou-act2-puzzle-v092.html)。预定 Pages 路径为 `https://d7gkdrs4pk-gif.github.io/roompath-game/ye-lou-act2-puzzle-v092.html?v=0.9.2`，**该公网地址尚未成功独立验证，发布失败时不作为已上线成果宣传**。
- 上一已发布并保留的回退母版为 `ye-lou-act2-puzzle-v091.html`，其原文件完整保留；Blob `11775607dc78a2ff8afda5f7d80d2be215d324cd`，SHA-256 `5757bb07084d9b588d456832a55d0d82b31ae364715ba0e24c33046eda28e398`。
- V0.9.1 已有试玩：[原发布地址](https://d7gkdrs4pk-gif.github.io/roompath-game/ye-lou-act2-puzzle-v091.html?v=0.9.1)。继续保留 [V0.9.1 交接单](./HANDOFF_G01-E_V0.9.1.md) 供回退核对，但它不再是本分支候选的执行入口。
- G01 正式稳定母版 `index.html` 仍为 V0.6、20关/60星，Blob `6527bf699df1a3714de82c2eb64bc0d8cc0d3a2f`，不覆盖。

## 2. 根因与精确改动

### 跨幕滚动

V0.9.1 的实际纵向滚动发生在 `#storyView`、`#routeView` 等 `.game-view`，部分内容还有嵌套滚动。`setView` 只调用 `window.scrollTo(0,0)`，并不能清除这些容器的偏移。第一幕真实通关后进入第二幕可保留 52px 的故事偏移；后续幕甚至继承数百像素，头图和字幕落在视口外。

V0.9.2 在共用 `resetStage` 中标记各视图待复位。每个视图正式显示并完成 `renderFlow` 后，只在新幕/新一轮尝试首次进入时消费标记，复位自身和实际有偏移的后代容器；同步执行后再用一次 `requestAnimationFrame` 处理显示后的布局时序。每次 `setView` 递增的切换序号阻止旧回调影响后续导航；新幕与同幕重玩都必经 `resetStage → setView('landing')`。

普通 `render()`、清空重选、撤销、同幕返回均不会重新标记，也不会反复强制跳顶；同幕阅读位置保留。重玩本幕开始新一轮尝试，首入视图从起始位置显示，既有成绩不变。

### 顶栏点击

320px 时 `.top::after` 的粉紫装饰图形覆盖档案图标局部，并参与命中测试；原坐标 `(30,26)` 落在按钮矩形内却命中 `HEADER`，不触发档案。

唯一 CSS 改动是在该装饰伪元素增加 `pointer-events:none`。不改尺寸、位置、层级、Logo 外观、按钮结构或任何透明覆盖层。覆盖处现在由下方真实按钮接收点击。

### 与 V0.9.1 的范围比较

新 HTML 由已核验的 V0.9.1 原样复制后定点修改，实际差异为 17 行新增、2 行删除（其中含标题版本标识）；只涉及标题、装饰层命中与视图滚动呈现。其余 10 个脚本块及外部模块引用逐字节一致，原剧情、分支、旋转/连通/逃脱、奖励、排名、分享和存档算法未改。

本批文件仅：新候选 HTML、两个可复跑回归脚本、本交接单及本分支 `PROJECT_STATUS.md`。没有改 V0.9.1 或任何已有游戏/Skill 文件。

## 3. 验证结果与复跑

环境：Chromium `154.0.8037.57`，完整候选 HTML 加原机关模块，经本地 HTTP 服务运行；不使用页面桩。浏览器上下文和存档隔离，不接触玩家真实数据。后续幕解锁部分使用原有存档字段布置测试前提，第一幕到第二幕则在每档视口使用全新存档真实 UI 通关。

| 验证 | 结果 |
| --- | --- |
| 320×568、360×740、375×667、390×844、1280×850 | 15 个隔离案例、292/292 项通过 |
| 第一幕真实通关进入第二幕，第二至第六幕连续切换 | 首入故事/拼房及实际嵌套容器从起点显示 |
| 同幕返回、清空重选、撤销、重玩 | 阅读位置和新尝试起点符合预期，既有奖励保持 |
| 顶栏档案按钮网格采样及实际点击 | 每档15点，320额外原遮挡点通过；动效和返回入口通过 |
| 第二幕原完整页面机关回归 | 5 个隔离案例、45/45 项通过 |
| JavaScript | 0 新增页面错误，11 个内联脚本语法编译通过 |
| 冻结内容 | V0.9.1、原机关模块、两个官方 Skill 文件 Blob 均未变 |

45 项基线覆盖电梯/消防门主路线、双向检修记录备用出口、20A/错误工具/缺安全探针/缺示警灯拒绝、旧地图不能绕过维修、旧存档无检修记录主线可用、刷新恢复、隐藏录音及奖励防重。

复跑针对性检查（需要 Python Playwright 与 Chromium，脚本自动启停临时本地服务）：

```bash
python tests/g01-e-v092-regression.py --out /tmp/ye-lou-v092-test
```

复用原 45 项机关检查（先在一个终端开启临时服务，再在另一个终端运行检查，结束后关闭服务）：

```bash
python -m http.server 8872 --bind 127.0.0.1 --directory .
python tests/g01-e-v092-act2.py --url http://127.0.0.1:8872/ye-lou-act2-puzzle-v092.html --output /tmp/ye-lou-v092-test/act2
```

本会话结果与截图：`/tmp/ye-lou-v092-test/regression-results.json`、`/tmp/ye-lou-v092-test/act2/results.json` 及其相邻 PNG。临时目录不保证跨环境保留，因此将可复跑测试源码随分支提交，结果摘要固定在本交接单中。

## 4. 冻结项、限制与风险

- 视觉永久沿用深蓝夜楼、粉紫霓虹、漫画化2.5D、电影化构图、大字号剧情卡，六幕共用规范不变；第三至六幕独立插画缺口不在本批。
- 冻结原20关/60星、六幕剧情与分支、档案碎片/徽章/奖励、好友排名、分享及所有原存档键和数据结构。
- `act2-workshop-v090.js` 不改，Blob `8efc304900e25d82889369408c89545aa0715e70`，SHA-256 `09b6053bb40cb00f00c1f1ac0de477c0d4e5342c6aba69b04ef4f0281f0482ad`。
- Anthropic 官方 Skill 原文及 Apache-2.0 文件不改，既有技能接入和模型验证状态不在本轮重新处理。
- **真实 iPhone Safari/微信未验证。** Chromium 的触控/视口模拟不代表真机验收；V0.9.2 公网 HTTPS 页面本环境无法独立取得响应，不声称真机通过。
- **合并后部署核验：** PR #2 已合并；`main` 上 V0.9.2 Git Blob 为 `b4c5bdc28bb785a2569324aa57bd580a8a055876`；V0.9.1 及原20关/机关模块 Blob 不变。Pages Actions 运行 [41288195540](https://github.com/d7gkdrs4pk-gif/roompath-game/actions/runs/41288195540)：`build` 与状态上报成功，但 `deploy` 因上一版本 `f967e877da0f94bd7dd519eb32bb58a6dc3e620a` 部署并发锁返回 HTTP 400，**不是游戏编译失败**。已仅对失败作业发起一次重试，记录时为 queued；禁止将其当成部署成功。此后只做状态文件同步，不变更游戏文件；状态同步可能再次触发 GitHub Pages 工作流，应按实际结果区分。

## 5. 下一轮唯一任务与接续指令

**先确认 GitHub Pages V0.9.2 自动部署/重试是否成功并核验真实 HTTPS 页面**；部署成功后，在真实 iPhone Safari/微信核对跨幕起始位置、同幕返回及 320px 顶栏档案按钮。若部署仍受并发锁阻塞，登记平台问题，不扩大代码修改。未完成真机验收前不得认定游戏全面验收通过；不扩展玩法或独立插画。

> 继续《夜楼档案》G01-E V0.9.2：先读 main 的 PROJECT_STATUS.md 和 HANDOFF_G01-E_V0.9.2.md，以 ye-lou-act2-puzzle-v092.html 为唯一当前研发试玩母版，V0.9.1 仅作回退。先核验 Actions 41288195540 和当前 Pages 部署结果；网页可访问后再在真实 iPhone Safari/微信验收两个缺陷。保留所有冻结内容，不重复修复、不启动视觉改版。
