# COZY UI — Vite 개발 서버 시작 (ERR_CONNECTION_REFUSED / -102 해결용)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 1) 프로젝트 portable Node (npm 포함)  2) 시스템 Node.js
$portableNode = Join-Path $PSScriptRoot ".tools\node-v22.16.0-win-x64"
$nodeDirs = @(
  $portableNode,
  "C:\Program Files\nodejs",
  "${env:ProgramFiles(x86)}\nodejs",
  "$env:LOCALAPPDATA\Programs\node",
  "$env:APPDATA\npm"
)
foreach ($dir in $nodeDirs) {
  if ($dir -and (Test-Path $dir)) {
    $env:PATH = "$dir;$env:PATH"
  }
}

function Test-Npm {
  return [bool](Get-Command npm -ErrorAction SilentlyContinue)
}

if (-not (Test-Npm)) {
  Write-Host ""
  Write-Host "========================================" -ForegroundColor Red
  Write-Host " npm을 찾을 수 없습니다 (-102 원인)" -ForegroundColor Red
  Write-Host "========================================" -ForegroundColor Red
  Write-Host ""
  Write-Host "브라우저만 열면 연결 실패합니다. 아래를 먼저 해 주세요:" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "  1) https://nodejs.org/ 에서 LTS 설치" -ForegroundColor White
  Write-Host "  2) Cursor / 터미널을 완전히 종료 후 다시 실행" -ForegroundColor White
  Write-Host "  3) 이 스크립트를 다시 실행:  .\start-dev.ps1" -ForegroundColor White
  Write-Host ""
  Write-Host "설치 확인 (새 터미널):" -ForegroundColor Cyan
  Write-Host "  node --version" -ForegroundColor Gray
  Write-Host "  npm --version" -ForegroundColor Gray
  Write-Host ""
  exit 1
}

Write-Host "Node: $(node --version)  npm: $(npm --version)" -ForegroundColor DarkGray

if (-not (Test-Path "node_modules")) {
  Write-Host ""
  Write-Host "의존성 설치 중 (npm install) — 최초 1회, 1~2분 걸릴 수 있습니다..." -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " 개발 서버 시작됨 — 이 창을 닫지 마세요!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "위 주소가 뜬 뒤 Cursor Simple Browser 또는 Chrome에서 접속하세요." -ForegroundColor DarkGray
Write-Host ""

npm run dev
