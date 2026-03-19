param(
  [string]$HostName = "localhost",
  [int]$Port = 5432,
  [string]$UserName = "postgres",
  [string]$DatabaseName = "easybooking",
  [string]$SchemaPath = ".\postgres\schema.sql"
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Команда '$Name' не найдена. Сначала установите PostgreSQL и убедитесь, что psql добавлен в PATH."
  }
}

function Invoke-Psql {
  param(
    [string]$Database,
    [string]$Sql
  )

  & psql `
    --host $HostName `
    --port $Port `
    --username $UserName `
    --dbname $Database `
    --command $Sql
}

Require-Command "psql"

if (-not (Test-Path $SchemaPath)) {
  throw "Файл схемы не найден: $SchemaPath"
}

Write-Host "Проверяю подключение к PostgreSQL..." -ForegroundColor Cyan
Invoke-Psql -Database "postgres" -Sql "SELECT version();"

Write-Host "Создаю базу $DatabaseName, если её ещё нет..." -ForegroundColor Cyan
$dbExists = & psql `
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
& psql `
  --host $HostName `
  --port $Port `
  --username $UserName `
  --dbname $DatabaseName `
  --file $SchemaPath

Write-Host ""
Write-Host "Готово." -ForegroundColor Green
Write-Host "База: $DatabaseName"
Write-Host "Дальше пропишите в bot/.env:"
Write-Host "POSTGRES_URL=postgresql://$UserName:ВАШ_ПАРОЛЬ@$HostName:$Port/$DatabaseName"
