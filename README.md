# 霓虹丛林：雷霆行动

一款原创的复古街机风横版射击网页游戏。玩家将突入被机械军团占领的雨林军工区，在奔跑、跳跃与八方向射击中夺取武器、激活检查点，并击败三阶段守关机甲。

> 本项目借鉴经典跑射游戏的玩法语言，但角色、世界观、界面、美术与音效均为原创内容，不使用《魂斗罗》的受版权保护素材。

## 在线试玩

**[启动《霓虹丛林：雷霆行动》](https://neon-jungle-operation-thunder.vercel.app/)**

## 游戏特色

- 一关完整流程：雨林前线、升降遗迹、核心要塞与 Boss 战
- 步兵、无人机、冲锋兽、炮塔和三阶段 Boss
- 步枪、散射枪、脉冲枪三类武器
- 生命、分数、连击、武器和 Boss 状态 HUD
- 键鼠与移动端触控双输入
- 原创生成式美术、程序化特效与 Web Audio 合成音效
- 暂停、检查点、胜利和失败结算流程

## 操作

| 动作 | 键盘 | 触屏 |
| --- | --- | --- |
| 移动 / 瞄准 | `WASD` 或方向键 | 左侧方向键 |
| 射击 | `J` 或空格 | `FIRE` |
| 跳跃 | `K` 或 Shift | `JUMP` |
| 暂停 | Esc | — |
| 重新开始 | `R` | 结算面板按钮 |

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址即可开始游戏。

## 质量验证

```bash
npm test -- --run
npm run typecheck
npm run build
npm run test:e2e
```

端到端测试覆盖开始任务、移动、射击、暂停/恢复、普通敌人受击得分，以及 Boss 最后一击与胜利结算。

## 技术栈

- React 19 + TypeScript + Vite
- Phaser 3
- Vitest + Testing Library
- Playwright
- Vercel 静态部署

## 目录

```text
src/
  assets/       生成式美术与资源清单
  game/         Phaser 场景、实体、系统和游戏规则
  ui/           React HUD、菜单与触控层
tests/          单元与组件测试
e2e/            浏览器端到端测试
design/         视觉概念图
```

## 构建与部署

```bash
npm run build
```

生产文件输出到 `dist/`。仓库包含 `vercel.json`，可直接导入 Vercel 或使用 Vercel CLI 部署。
