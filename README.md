# Animation Viewer

Motifect 风格的 3D 动画查看器，支持 GLB/GLTF/FBX 格式的骨骼动画预览。

🔗 **在线预览**: [https://dlldsys.github.io/animation-viewer/](https://dlldsys.github.io/animation-viewer/)

## 使用方式

### 方式一：本地 HTTP 服务器（推荐）

因为有 Three.js 跨域需求，需要用 HTTP 服务器打开：

```bash
# 方式 A — Python
cd D:\codes\animation-viewer
python -m http.server 8080

# 方式 B — Node.js (npx)
npx serve .

# 方式 C — VS Code Live Server
右键 index.html → Open with Live Server
```

然后打开浏览器访问 `http://localhost:8080`

### 方式二：直接打开（有限支持）

双击 `index.html` 在浏览器中直接打开。部分浏览器可能因 CORS 限制无法加载本地文件。

## 功能特性

| 功能 | 说明 |
|------|------|
| **拖拽上传** | 拖拽 .glb / .gltf / .fbx 文件到页面或上传区域 |
| **点击上传** | 点击上传区域选择文件 |
| **动画播放** | 自动播放 GLB 或 FBX 中的嵌入动画 |
| **播放/暂停** | 控制动画播放状态 |
| **进度条** | 拖动进度条跳转到任意时间点 |
| **循环开关** | 切换单次播放/循环播放 |
| **角色网格** | 切换显示/隐藏角色网格（隐藏后仅剩骨骼） |
| **网格线框** | 切换所有网格的线框显示模式 |
| **坐标轴** | 显示/隐藏世界坐标轴 (XYZ 方向) |
| **地面网格** | 显示/隐藏地面参考网格 |
| **跟随角色** | 摄像机跟随角色在 XZ 平面上的移动 |
| **轨道控制** | 鼠标拖拽旋转视角、滚轮缩放、右键平移 |

## 快捷键

- `Space` — 播放/暂停
- `R` — 切换循环
- `Esc` — 重置视角

## 技术栈

- **Three.js** (r170) — 3D 渲染引擎
- **GLTFLoader + DRACOLoader** — GLB/GLTF 模型加载（支持 Draco 压缩）
- **FBXLoader** — FBX 格式加载
- **OrbitControls** — 视角轨道控制
- **ACES Filmic Tone Mapping** — 电影级色调映射

## 文件结构

```
animation-viewer/
├── index.html    # 单页应用，所有代码都在一个文件中
└── README.md
```

将您的 .glb 文件拖入页面即可查看动画。
