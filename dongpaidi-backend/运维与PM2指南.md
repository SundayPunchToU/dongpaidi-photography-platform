# 懂拍帝摄影平台 后端运维与 PM2 指南

面向后续维护同学的运行/重启/验证手册，归档本次排障经验，避免同类问题反复发生。

— 最重要的两句话 —
- 不要用 `node start-simple.js` 直接起服务！后端由 PM2 托管，正确方式是 `pm2 start ...` 或 `pm2 restart ...`。
- 修改后端代码后，必须执行 `pm2 restart dongpaidi-integrated-api`（如有环境变量变更加上 `--update-env`）。

---

## 1. 架构与运行方式概览
- 进程管理：PM2（用户级守护，彼此隔离）
- 运行用户：ubuntu（极其重要，同一台机器不同用户各有一套 PM2 守护）
- 服务名称（PM2）：`dongpaidi-integrated-api`
- 启动脚本：`/home/ubuntu/dongpaidi-photography-platform/dongpaidi-backend/start-simple.js`
- 监听端口：3000（由 Nginx 80 端口反向代理）
- 日志位置：`~/.pm2/logs/dongpaidi-integrated-api-*.log`

为何强调“运行用户”？因为 root 与 ubuntu 各自有独立的 PM2 守护与进程列表。用 root 执行 `pm2 list` 看不到 ubuntu 用户下的进程，用 root 重启也不会影响 ubuntu 的 PM2 进程。

---

## 2. 为什么“重启 PM2 很麻烦”？根因总结
本次问题的本质有三点：
1) 多用户 PM2 隔离：你用 root 操作 PM2，但服务是 ubuntu 用户启动的 PM2 在管，所以 root 的 `pm2 restart` 无效；
2) 端口被“孤儿 Node 进程”占用：历史上有人用 `node ...` 手工起过，进程一直占着 3000 端口，PM2 重启不影响这个孤儿进程；
3) 代码与进程不一致：Nginx 实际把请求打给了“占着 3000 的那个旧进程”，导致你看不到新代码的日志/行为，误以为“重启没生效”。

典型症状：
- PM2 日志显示已重启，但线上接口行为/错误信息仍是旧的；
- PM2 日志反复报 `EADDRINUSE`（地址被占用）；
- `pm2 list` 显示在线，但 `curl` 命中返回并非新逻辑日志。

---

## 3. 最正确的启动/重启方式（标准操作）
确保以 ubuntu 用户执行（如当前在 root 下，请用 su/sudo 切换）：

```bash
# 以 ubuntu 用户执行 PM2（推荐）
sudo -u ubuntu -H bash -lc 'pm2 status'

# 首次启动（或不存在时）
sudo -u ubuntu -H bash -lc 'pm2 start /home/ubuntu/dongpaidi-photography-platform/dongpaidi-backend/start-simple.js --name dongpaidi-integrated-api'

# 常规重启（代码改动后）
sudo -u ubuntu -H bash -lc 'pm2 restart dongpaidi-integrated-api'

# 若环境变量有调整，带上 --update-env
sudo -u ubuntu -H bash -lc 'pm2 restart dongpaidi-integrated-api --update-env'

# 查看最近日志
sudo -u ubuntu -H bash -lc "pm2 logs dongpaidi-integrated-api --lines 80"
```

建议配合开机自启与进程快照：
```bash
sudo -u ubuntu -H bash -lc 'pm2 save'
sudo -u ubuntu -H bash -lc "pm2 startup systemd -u ubuntu --hp /home/ubuntu"
```

---

## 4. 一键重启与验证（脚本）
仓库自带脚本：`dongpaidi-backend/scripts/restart_and_verify.sh`

功能：
- 重启 PM2 的 `dongpaidi-integrated-api`
- 验证 `/api/v1/upload/config` 路由
- 尝试管理员登录并解析 `sessionId`
- 生成最小测试图片，上传验证 `/api/v1/upload/single-image`
- 打印 PM2 日志关键片段

使用（在项目根目录执行）：
```bash
chmod +x dongpaidi-backend/scripts/restart_and_verify.sh
bash dongpaidi-backend/scripts/restart_and_verify.sh
```
若提示 pm2 不在 PATH，或你在 root 下：
```bash
sudo -u ubuntu -H bash -lc '/home/ubuntu/dongpaidi-photography-platform/dongpaidi-backend/scripts/restart_and_verify.sh'
```

---

## 5. 端口被占时的“接管流程”（故障恢复模板）
当 PM2 重启“看似成功但无效”时，按以下步骤接管 3000 端口：

```bash
# 1) 停止 PM2 托管，避免争抢
sudo -u ubuntu -H bash -lc 'pm2 stop dongpaidi-integrated-api || true'

# 2) 找出并杀掉占用 3000 的孤儿进程
sudo netstat -tlnp | grep ':3000'
# 记下 PID 后：
sudo kill -9 <PID>

# 3) 确认端口释放
sudo netstat -tlnp | grep ':3000' || echo 'Port 3000 is free'

# 4) 用 PM2 唯一地启动服务（由 ubuntu 用户）
sudo -u ubuntu -H bash -lc 'pm2 start /home/ubuntu/dongpaidi-photography-platform/dongpaidi-backend/start-simple.js --name dongpaidi-integrated-api'

# 5) 观察日志，执行一次登录+上传验证
sudo -u ubuntu -H bash -lc "pm2 logs dongpaidi-integrated-api --lines 80"
```

要点：确保“监听 3000 的进程”是 PM2 拉起的。可通过 `ps -fp <PID>` 查看 PPID，PM2 的 God Daemon 进程会体现在父进程链路里。

---

## 6. 变更与验证清单（日常运维）
- 修改了后端代码：
  - 执行 `pm2 restart dongpaidi-integrated-api`
  - `pm2 logs` 检查有没有语法错误、端口占用（EADDRINUSE）
- 新增/修改环境变量：
  - `pm2 restart dongpaidi-integrated-api --update-env`
- 快速健康检查：
  - `curl -i http://152.136.155.183/api/v1/upload/config`
- 登录拿 Session：
  - `curl -s -H 'Content-Type: application/json' -d '{"username":"admin@dongpaidi.com","password":"admin123456"}' http://152.136.155.183/api/v1/admin/login`
- 携带 `x-session-id` 进行上传验证：
  - `curl -i -X POST http://152.136.155.183/api/v1/upload/single-image -H 'x-session-id: <SESSION_ID>' -F 'image=@/path/to/your.jpg'`

---

## 7. 本次问题的技术细节与修复
- 独立的“孤儿 Node 进程”占用 3000 端口，Nginx 命中了旧代码实例；
- PM2 重启只能影响 PM2 管的进程，不影响孤儿进程；
- 代码侧：`ImageProcessingService` 实例方法错误地用 `this.QUALITY_SETTINGS`、`this.MAX_DIMENSIONS`、`this.THUMBNAIL_SIZES` 访问静态字段，在某些路径上导致读取 `undefined` 的 `original` 键报错；
- 现已修正为 `ImageProcessingService.QUALITY_SETTINGS/MAX_DIMENSIONS/THUMBNAIL_SIZES` 并增加容错与结构校验日志；
- `BatchUploadController` 在保存前新增结构健壮性检查，避免空对象读取；
- 已通过“登录→单图上传”端到端验证（日志显示原图、压缩图、3 个缩略图均成功保存）。

---

## 8. 常见问题（FAQ）
- Q: `pm2 restart` 报“Process not found”？
  - A: 你可能在 root 下操作，但服务在 ubuntu 的 PM2 里。使用 `sudo -u ubuntu -H bash -lc 'pm2 list'` 查看。

- Q: 日志反复出现 `EADDRINUSE`？
  - A: 3000 端口被其他进程占用。用 `sudo netstat -tlnp | grep ':3000'` 找 PID，`sudo kill -9 <PID>` 后再由 PM2 启动。

- Q: 登录/上传 401？
  - A: 缺少 `x-session-id` 请求头或 Session 过期。先调用 `/api/v1/admin/login` 获取 `sessionId` 再携带请求头。

- Q: `SyntaxError: Unexpected token u in JSON at position 0`？
  - A: 对 JSON 接口使用了错误的 `Content-Type` 或请求体为空。确保 `-H 'Content-Type: application/json' -d '{...}'`。

- Q: Sharp 未安装怎么办？
  - A: 代码已带“开发用 Mock”，日志会打印“Sharp库未安装，使用模拟版本”。上线若需真实压缩，请在网络可达环境安装 sharp 并重启。

---

## 9. 约定与最佳实践
- 统一使用 PM2 管理 Node 服务，禁止裸 `node` 启动线上服务；
- 统一以 ubuntu 用户运行 PM2，避免多用户多套守护混乱；
- 每次变更后都执行最小验证：`/upload/config` → 登录 → 单图上传 → 查看 PM2 日志；
- 若发生异常，优先看 PM2 日志，再看端口占用与父子进程链路；
- 对外暴露统一走 Nginx，后端仅监听 3000。

---

## 10. 附：快速命令清单（可复制）
```bash
# 查看 ubuntu 用户 PM2 列表
sudo -u ubuntu -H bash -lc 'pm2 list'

# 重启服务（代码变更）
sudo -u ubuntu -H bash -lc 'pm2 restart dongpaidi-integrated-api'

# 重启服务并刷新环境变量
audo -u ubuntu -H bash -lc 'pm2 restart dongpaidi-integrated-api --update-env'

# 端口占用排查与接管
sudo -u ubuntu -H bash -lc 'pm2 stop dongpaidi-integrated-api || true'
sudo netstat -tlnp | grep ':3000'
sudo kill -9 <PID>
sudo -u ubuntu -H bash -lc 'pm2 start /home/ubuntu/dongpaidi-photography-platform/dongpaidi-backend/start-simple.js --name dongpaidi-integrated-api'

# 查看日志
sudo -u ubuntu -H bash -lc 'pm2 logs dongpaidi-integrated-api --lines 100'
```

> 维护口令：
> - 管理登录：`admin@dongpaidi.com / admin123456`
> - 会话头：`x-session-id: <登录返回的 sessionId>`

---

如需扩展：可把本指南加入运维 Wiki，并将 `scripts/restart_and_verify.sh` 设为标准回归验证脚本。

