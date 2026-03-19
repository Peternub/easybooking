param(
  [string]$HostName = "localhost",
  [int]$Port = 5432,
  [string]$UserName = "postgres",
  [string]$DatabaseName = "easybooking",
  [string]$SchemaPath = ".\postgres\schema.sql",
  [string]$Password = ""
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

function Get-DatabasePassword {
  if ($Password) {
    return $Password
  }

  $securePassword = Read-Host "Введите пароль пользователя $UserName" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
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
    --no-password `
    --command $Sql
}

$script:PsqlCommand = Get-PsqlCommand

if (-not (Test-Path $SchemaPath)) {
  throw "Файл схемы не найден: $SchemaPath"
}

$env:PGPASSWORD = Get-DatabasePassword

try {
  Write-Host "Проверяю подключение к PostgreSQL..." -ForegroundColor Cyan
  Invoke-Psql -Database "postgres" -Sql "SELECT version();"

  Write-Host "Создаю базу $DatabaseName, если её ещё нет..." -ForegroundColor Cyan
  $dbExists = & $script:PsqlCommand `
    --host $HostName `
    --port $Port `
    --username $UserName `
    --dbname "postgres" `
    --no-password `
    --tuples-only `
    --no-align `
    --quiet `
    --command "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';"

  if ($LASTEXITCODE -ne 0) {
    throw "Не удалось проверить наличие базы $DatabaseName."
  }

  $dbExistsText = ($dbExists | Out-String).Trim()
  if ($dbExistsText -ne "1") {
    Invoke-Psql -Database "postgres" -Sql "CREATE DATABASE $DatabaseName;"
  }

  Write-Host "Применяю схему из $SchemaPath..." -ForegroundColor Cyan
  & $script:PsqlCommand `
    --host $HostName `
    --port $Port `
    --username $UserName `
    --dbname $DatabaseName `
    --no-password `
    --file $SchemaPath

  if ($LASTEXITCODE -ne 0) {
    throw "Не удалось применить схему PostgreSQL."
  }

  Write-Host ""
  Write-Host "Готово." -ForegroundColor Green
  Write-Host "База: $DatabaseName"
  Write-Host "Дальше пропишите в bot/.env:"
  Write-Host "POSTGRES_URL=postgresql://${UserName}:ВАШ_ПАРОЛЬ@${HostName}:${Port}/${DatabaseName}"
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
