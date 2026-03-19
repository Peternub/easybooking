param(
  [string]$HostName = "localhost",
  [int]$Port = 5432,
  [string]$UserName = "postgres",
  [string]$DatabaseName = "easybooking",
  [string]$SchemaPath = ".\postgres\schema.sql"
)

$ErrorActionPreference = "Stop"

function Get-PsqlCommand {
  $command = Get-Command "psql" -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $commonPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe"
  )

  foreach ($path in $commonPaths) {
    if (Test-Path $path) {
      return $path
    }
  }

  throw "Команда 'psql' не найдена. PostgreSQL установлен, но путь к psql не найден."
}

function Invoke-Psql {
  param(
    [string]$Database,
    [string]$Sql
  )

  & $script:PsqlCommand `
    --host $HostName `
    --port $Port `
    --username $UserName `
    --dbname $Database `
    --command $Sql
}

$script:PsqlCommand = Get-PsqlCommand

if (-not (Test-Path $SchemaPath)) {
  throw "Файл схемы не найден: $SchemaPath"
}

Write-Host "Проверяю подключение к PostgreSQL..." -ForegroundColor Cyan
Invoke-Psql -Database "postgres" -Sql "SELECT version();"

Write-Host "Создаю базу $DatabaseName, если её ещё нет..." -ForegroundColor Cyan
$dbExists = & $script:PsqlCommand `
  --host $HostName `
  --port $Port `
  --username $UserName `
  --dbname "postgres" `
  --tuples-only `
  --no-align `
  --command "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';"

if ($dbExists.Trim() -ne "1") {
  Invoke-Psql -Database "postgres" -Sql "CREATE DATABASE $DatabaseName;"
}

Write-Host "Применяю схему из $SchemaPath..." -ForegroundColor Cyan
& $script:PsqlCommand `
  --host $HostName `
  --port $Port `
  --username $UserName `
  --dbname $DatabaseName `
  --file $SchemaPath

Write-Host ""
Write-Host "Готово." -ForegroundColor Green
Write-Host "База: $DatabaseName"
Write-Host "Дальше пропишите в bot/.env:"
Write-Host "POSTGRES_URL=postgresql://${UserName}:ВАШ_ПАРОЛЬ@${HostName}:${Port}/${DatabaseName}"
