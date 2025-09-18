#!/usr/bin/env bash
# 懂拍帝摄影平台 - 上传功能重启与验证脚本
# 用途: 通过 PM2 重启后端服务并进行基础联通与上传接口验证
# 说明: 需在部署服务器上执行，要求已安装并可执行 pm2
# 使用: bash dongpaidi-backend/scripts/restart_and_verify.sh [SESSION_ID]
# 如果已知会话ID，可作为第一个参数传入；否则脚本会尝试自动登录解析会话ID。

set -euo pipefail

SERVICE_NAME="dongpaidi-integrated-api"
BASE_URL="http://152.136.155.183"
UPLOAD_CONFIG_URL="$BASE_URL/api/v1/upload/config"
LOGIN_URL_JSON_USER="$BASE_URL/api/v1/admin/login"
SINGLE_UPLOAD_URL="$BASE_URL/api/v1/upload/single-image"

SESSION_ID="${1:-}"

log() { echo -e "[\033[1;34mINFO\033[0m] $*"; }
ok() { echo -e "[\033[1;32mOK\033[0m]   $*"; }
warn() { echo -e "[\033[1;33mWARN\033[0m] $*"; }
err() { echo -e "[\033[1;31mERR\033[0m]  $*"; }

# 1) 检查 pm2
if ! command -v pm2 >/dev/null 2>&1; then
  err "未找到 pm2 命令。请在服务器上安装/配置 pm2 后重试。"
  exit 1
fi
ok "已检测到 pm2: $(pm2 -v || true)"

# 2) 重启服务
log "重启 PM2 服务: $SERVICE_NAME"
pm2 restart "$SERVICE_NAME" || { err "pm2 重启失败"; exit 1; }
# 等待应用就绪
sleep 3
ok "PM2 重启命令已执行"

# 3) 查看最近日志（可选）
log "最近 50 行 PM2 日志:"
pm2 logs "$SERVICE_NAME" --lines 50 --raw --nostream || true

# 4) 健康/配置检查
log "获取上传配置: $UPLOAD_CONFIG_URL"
HTTP_CODE=$(curl -s -o /tmp/upload_config.json -w "%{http_code}" "$UPLOAD_CONFIG_URL" || true)
echo "HTTP ${HTTP_CODE}"; cat /tmp/upload_config.json || true; echo

# 5) 若未提供 SESSION_ID，尝试自动登录
if [[ -z "$SESSION_ID" ]]; then
  log "尝试使用 username 方式登录获取会话ID"
  RESP=$(curl -s -H 'Content-Type: application/json' \
    -d '{"username":"admin@dongpaidi.com","password":"admin123456"}' \
    "$LOGIN_URL_JSON_USER" || true)
  echo "$RESP"
  # 使用 node 解析 JSON（若可用）
  if command -v node >/dev/null 2>&1; then
    SESSION_ID=$(printf '%s' "$RESP" | node -e '
let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
  try{
    const j = JSON.parse(s);
    const sid = j.sessionId || (j.data && (j.data.sessionId||j.data.session_id)) || j.session_id || j.session || "";
    process.stdout.write(String(sid||""));
  }catch(e){/* ignore */}
});
')
  fi

  if [[ -z "$SESSION_ID" ]]; then
    warn "未从 username 登录中解析到 sessionId，尝试 email 字段登录"
    RESP=$(curl -s -H 'Content-Type: application/json' \
      -d '{"email":"admin@dongpaidi.com","password":"admin123456"}' \
      "$LOGIN_URL_JSON_USER" || true)
    echo "$RESP"
    if command -v node >/dev/null 2>&1; then
      SESSION_ID=$(printf '%s' "$RESP" | node -e '
let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
  try{
    const j = JSON.parse(s);
    const sid = j.sessionId || (j.data && (j.data.sessionId||j.data.session_id)) || j.session_id || j.session || "";
    process.stdout.write(String(sid||""));
  }catch(e){/* ignore */}
});
')
    fi
  fi
fi

if [[ -n "$SESSION_ID" ]]; then
  ok "已获取 SESSION_ID=$SESSION_ID"
else
  warn "仍未获取到 SESSION_ID。可手动登录后台复制 x-session-id 或将 SESSION_ID 作为参数传入本脚本。"
fi

# 6) 准备测试图片（1x1 像素 JPEG）
log "生成测试图片 test-image.jpg"
cat > /tmp/test.jpg.b64 <<'B64'
/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEA8QDw8QDw8PDw8PDw8PDw8QFREWFhURFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGi0fHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAgMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAAEBQIDBgEAB//EADsQAAIBAwIDBQQIBwAAAAAAAAECAwAEEQUSITFBUWEGEyIycaGxByNCUrHwQmLB0VNyc5KCsv/EABgBAQEBAQEAAAAAAAAAAAAAAAABAgME/8QAHBEBAQADAQEBAQAAAAAAAAAAAAERAhIhMUEi/9oADAMBAAIRAxEAPwCzqf6Xc4y0c7wN0hJ6xZQpSlq6eGJ3g1c0xWb9r0k1jQe6l3Zy0qJmYF1Hh8fM7B5b3tR0mKX7bH2W0p0H1m3Tq0rXyQk9mYx7Wl3p3bZb1cVtqXoM0yQJbQpM5A2m0qk2Cw5mUqUqgY0wFvzG0cGk8w3W1d5nT+0f2rUqgk8nH7i5lJZ3iF7x2d1d7a9fK2y9y1m7nQp7gL1aY8s8XbN3xkRZqUqWg7bzD3a2E4c6m1pG9O3ZV+VvWzjVdV2yV2LkQfQqJt0o2Gk8o5M4b2o0cZQpSlSgqkqgqkqgqgY9g7Jk0Wz5Y0e7P7Dui7T4Q4oewB0Jgqkqgqkqgqgqgqgqgqgqgqf/Z
B64
base64 -d /tmp/test.jpg.b64 > /tmp/test-image.jpg || cp /tmp/test.jpg.b64 /tmp/test-image.jpg
ls -lh /tmp/test-image.jpg || true

# 7) 调用单图上传接口（若拿到 SESSION_ID）
if [[ -n "$SESSION_ID" ]]; then
  log "调用单图上传接口"
  curl -i -X POST \
    -H "x-session-id: $SESSION_ID" \
    -F "image=@/tmp/test-image.jpg" \
    "$SINGLE_UPLOAD_URL" || true
else
  warn "没有 SESSION_ID，跳过上传接口调用。可手动提供 SESSION_ID 重新运行：bash $0 <SESSION_ID>"
fi

log "完成。如失败，请查看上面的 PM2 日志与接口响应内容并反馈给开发者。"

