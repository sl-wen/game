## DST-MVP（控制台版）

一个用 C#/.NET 9 构建的“饥荒（Don't Starve）”风格极简可玩原型（Console）。

### 目录结构

- `dst-mvp/`：控制台游戏源码与解决方案（`dst-mvp.sln`、`dst-mvp.csproj`）

### 运行环境

- .NET SDK 9.0+
- 终端需支持 UTF-8 输出

可通过系统包管理器安装 .NET，或使用仓库根目录的 `dotnet-install.sh` 脚本进行本地安装。

示例（可选）：
```bash
bash dotnet-install.sh --channel 9.0
```

### 快速开始

方式一：在子目录运行
```bash
cd dst-mvp
dotnet run
```

方式二：在仓库根目录指定项目运行
```bash
dotnet run --project dst-mvp
```

构建（可选）：
```bash
dotnet build
```

### 操作说明

- WASD：移动
- E：采集当前位置与四邻格
- F：制作篝火（消耗 3 木）
- T：制作火把（消耗 2 木）
- L：切换火把点燃
- Q：退出

界面图例：`.` 空地，`T` 树，`B` 浆果灌木，`F` 篝火，`@` 玩家

状态栏展示：时间（昼/夜）、饥饿、生命、木材与浆果数量、火把状态与剩余时间。

### 备注

- 游戏使用固定步进（约 10 TPS）。夜晚处于黑暗中会掉血，保持在光源附近或点燃火把以存活更久。