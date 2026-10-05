#Requires -RunAsAdministrator
[CmdletBinding()]
param(
    [ValidateSet("58mm", "80mm", "A4")]
    [string]$PaperWidth = "80mm",
    [string]$SettingsFile = (Join-Path $PSScriptRoot "servio-printer-settings.json")
)

$ErrorActionPreference = "Stop"
$certificatePath = Join-Path $PSScriptRoot "override.crt"
if (-not (Test-Path -LiteralPath $certificatePath -PathType Leaf)) {
    throw "ملف override.crt غير موجود بجانب هذا السكربت. استخرج حزمة إعداد SERVIO كاملة أولًا."
}

# تحقق من صلاحية الشهادة العامة قبل نسخها إلى مجلد QZ Tray.
$certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($certificatePath)
if ($certificate.NotAfter -le (Get-Date)) {
    throw "شهادة SERVIO منتهية الصلاحية؛ لا تتابع تثبيتها."
}

$programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
$candidates = @(
    (Join-Path $env:ProgramFiles "QZ Tray"),
    $(if ($programFilesX86) { Join-Path $programFilesX86 "QZ Tray" })
) | Where-Object { $_ }
$qzDirectory = $candidates | Where-Object {
    (Test-Path -LiteralPath (Join-Path $_ "QZ Tray.exe")) -or
    (Test-Path -LiteralPath (Join-Path $_ "qz-tray.exe"))
} | Select-Object -First 1

if (-not $qzDirectory) {
    $qzDirectory = (Read-Host "أدخل المسار الكامل لمجلد تثبيت QZ Tray").Trim([char[]]@('"', ' '))
    if (-not (Test-Path -LiteralPath $qzDirectory -PathType Container)) {
        throw "مجلد QZ Tray غير موجود: $qzDirectory"
    }
}

$targetCertificate = Join-Path $qzDirectory "override.crt"
if (Test-Path -LiteralPath $targetCertificate) {
    $backupPath = "$targetCertificate.servio-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item -LiteralPath $targetCertificate -Destination $backupPath
    Write-Host "تم الاحتفاظ بنسخة احتياطية من الشهادة السابقة: $backupPath"
}
Copy-Item -LiteralPath $certificatePath -Destination $targetCertificate -Force
Write-Host "ثُبّتت شهادة SERVIO العامة في: $targetCertificate"

$installedPrinters = @()
if (Get-Command Get-Printer -ErrorAction SilentlyContinue) {
    try {
        $installedPrinters = @(Get-Printer | ForEach-Object { $_.Name } | Sort-Object -Unique)
    } catch {
        Write-Warning "تعذر قراءة قائمة طابعات Windows؛ يمكنك اكتشافها لاحقًا من SERVIO."
    }
}

$selectedPrinters = @()
if ($installedPrinters.Count -gt 0) {
    Write-Host "`nالطابعات المسجلة في Windows:"
    for ($index = 0; $index -lt $installedPrinters.Count; $index++) {
        Write-Host ("  {0}. {1}" -f ($index + 1), $installedPrinters[$index])
    }
    $selection = (Read-Host "أدخل اسم طابعة واحدة أو اثنتين كما يظهران أعلاه، وافصل بينهما بالرمز |؛ اتركه فارغًا للتخطي").Trim()
    if ($selection) {
        $selectedPrinters = @($selection -split "\|" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
        if ($selectedPrinters.Count -gt 2) {
            throw "يسمح SERVIO بإعداد طابعة واحدة أو طابعتين فقط."
        }
        $unknownPrinters = @($selectedPrinters | Where-Object { $_ -notin $installedPrinters })
        if ($unknownPrinters.Count -gt 0) {
            throw "هذه الأسماء غير موجودة في Windows: $($unknownPrinters -join ', '). انسخ الاسم كما يظهر في القائمة."
        }
    }
} else {
    Write-Host "لم يعثر Windows على قائمة الطابعات. سينشأ ملف إعداد فارغ ويمكن اكتشاف الطابعة لاحقًا من SERVIO."
}

$settings = [ordered]@{
    app = "SERVIO"
    schemaVersion = 1
    printers = @($selectedPrinters)
    paperWidth = $PaperWidth
    autoPrintAfterSave = $true
}
$settingsJson = $settings | ConvertTo-Json -Depth 4
$outputPath = [System.IO.Path]::GetFullPath($SettingsFile)
$outputDirectory = [System.IO.Path]::GetDirectoryName($outputPath)
if ($outputDirectory) {
    [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
}
[System.IO.File]::WriteAllText(
    $outputPath,
    ($settingsJson + [Environment]::NewLine),
    [System.Text.UTF8Encoding]::new($false)
)
Write-Host "`nتم إنشاء ملف الإعداد: $outputPath"
Write-Host "أعد تشغيل QZ Tray يدويًا، ثم استورد JSON من SERVIO ← POS ← إعداد الطابعة."
Write-Host "المقاس المختار: $PaperWidth | عدد الطابعات في الملف: $($selectedPrinters.Count)"
