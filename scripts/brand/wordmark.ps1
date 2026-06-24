# Exploring To Know — wordmark PNG via GDI+ (Windows has the fonts the Linux container lacks).
# Composites the rounded lotus mark (from icon-512.png) with real-font text.
Add-Type -AssemblyName System.Drawing

$root   = Resolve-Path "$PSScriptRoot\..\.."
$markPng= Join-Path $root "apps\web\public\brand\icon-512.png"
$outPng = Join-Path $root "apps\web\public\brand\logo-wordmark.png"

$W = 740; $H = 380
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::Transparent)

# --- rounded mark ---
$mark = [System.Drawing.Image]::FromFile($markPng)
$mx = 40; $my = 40; $ms = 300; $r = 66
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$d = $r * 2
$path.AddArc($mx, $my, $d, $d, 180, 90)
$path.AddArc($mx + $ms - $d, $my, $d, $d, 270, 90)
$path.AddArc($mx + $ms - $d, $my + $ms - $d, $d, $d, 0, 90)
$path.AddArc($mx, $my + $ms - $d, $d, $d, 90, 90)
$path.CloseFigure()
$g.SetClip($path)
$g.DrawImage($mark, $mx, $my, $ms, $ms)
$g.ResetClip()

# --- text ---
$green = [System.Drawing.Color]::FromArgb(12, 75, 57)
$gold  = [System.Drawing.Color]::FromArgb(201, 150, 46)
$brGreen = New-Object System.Drawing.SolidBrush($green)
$brGold  = New-Object System.Drawing.SolidBrush($gold)
$font = New-Object System.Drawing.Font("Segoe UI Semibold", 72, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fmt = [System.Drawing.StringFormat]::GenericTypographic

$tx = 396
# Line 1
$g.DrawString("Exploring", $font, $brGreen, [single]$tx, [single]70, $fmt)
# Line 2: "To" (green) + space + "Know" (gold). Compute the exact space width in
# typographic mode (which otherwise trims trailing whitespace).
$y2 = 196
$toW   = $g.MeasureString("To",   $font, [int]0, $fmt).Width
$knowW = $g.MeasureString("Know", $font, [int]0, $fmt).Width
$bothW = $g.MeasureString("To Know", $font, [int]0, $fmt).Width
$spaceW = $bothW - $toW - $knowW
$g.DrawString("To", $font, $brGreen, [single]$tx, [single]$y2, $fmt)
$g.DrawString("Know", $font, $brGold, [single]($tx + $toW + $spaceW), [single]$y2, $fmt)

$g.Dispose()
$bmp.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose(); $mark.Dispose()
Write-Output ("wrote " + $outPng + " (" + (Get-Item $outPng).Length + " bytes)")
