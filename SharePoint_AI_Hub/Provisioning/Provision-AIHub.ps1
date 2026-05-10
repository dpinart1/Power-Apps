<#
.SYNOPSIS
    Provisions the AI Hub solution on a SharePoint Online site.

.DESCRIPTION
    Idempotent script that:
      1. Connects to the target site (interactive auth by default).
      2. Creates the AIHubAssets and AIHub_Policies document libraries.
      3. Creates 18 AIHub_* lists with their columns and choice values
         (skipping any list that already exists).
      4. Loads seed data from .\SeedData\*.json into each list.
      5. Uploads CSS / JS / HTML to AIHubAssets/AIHub/.
      6. Uploads the two Classic ASPX pages to AIHubAssets/AIHub/.
      7. Optionally creates a Modern Page (AIHub) with an Embed Web Part.

.PARAMETER SiteUrl
    Target SharePoint Online site URL.

.PARAMETER SkipModernPage
    Skip creation of the Modern Page (Variant C).

.PARAMETER ReseedData
    If specified, deletes existing items before re-inserting seed data.
    Without this switch, lists with existing items are left untouched.

.EXAMPLE
    .\Provision-AIHub.ps1 -SiteUrl https://contoso.sharepoint.com/sites/AIHub

.NOTES
    Requires PnP.PowerShell v2+.  Install with: Install-Module PnP.PowerShell -Scope CurrentUser
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $SiteUrl,

    [switch] $SkipModernPage,
    [switch] $ReseedData
)

$ErrorActionPreference = 'Stop'
$here  = Split-Path -Parent $MyInvocation.MyCommand.Path
$root  = Split-Path -Parent $here  # SharePoint_AI_Hub/

Write-Host "AI Hub provisioning starting at $(Get-Date -Format s)" -ForegroundColor Cyan
Write-Host "Site:        $SiteUrl"
Write-Host "Source root: $root"
Write-Host ""

# -------------------------------------------------------------------
# 1) Connect
# -------------------------------------------------------------------
if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    throw "PnP.PowerShell is not installed. Run: Install-Module PnP.PowerShell -Scope CurrentUser"
}
Import-Module PnP.PowerShell -ErrorAction Stop

Write-Host "Connecting (interactive)..." -ForegroundColor Yellow
Connect-PnPOnline -Url $SiteUrl -Interactive

# Disable NoScriptSite for Variant A (Classic ASPX in SiteAssets)
try {
    Set-PnPSite -NoScriptSite:$false -ErrorAction SilentlyContinue
    Write-Host "NoScriptSite disabled (required for Variant A)." -ForegroundColor DarkGray
} catch {
    Write-Warning "Could not toggle NoScriptSite (insufficient rights). Variant A may fail."
}

# -------------------------------------------------------------------
# 2) Schema → libraries + lists
# -------------------------------------------------------------------
$schemaPath = Join-Path $here 'Schema-AIHub.json'
$schema     = Get-Content -Raw -LiteralPath $schemaPath | ConvertFrom-Json

function Ensure-List {
    param(
        [Parameter(Mandatory)] $Definition,
        [Parameter(Mandatory)] [string] $Template  # "GenericList" or "DocumentLibrary"
    )
    $title = $Definition.title
    $list  = Get-PnPList -Identity $title -ErrorAction SilentlyContinue
    if ($null -eq $list) {
        Write-Host "  Creating $Template '$title' ..." -ForegroundColor Green
        $list = New-PnPList -Title $title -Template $Template -OnQuickLaunch:$false
    } else {
        Write-Host "  $Template '$title' already exists." -ForegroundColor DarkGray
    }
    return $list
}

function Ensure-Field {
    param(
        [Parameter(Mandatory)] $List,
        [Parameter(Mandatory)] $Field
    )
    $existing = Get-PnPField -List $List -Identity $Field.internalName -ErrorAction SilentlyContinue
    if ($existing) { return }

    $required = ($Field.required -eq $true)

    switch ($Field.type) {
        'Choice' {
            $choicesXml = ($Field.choices | ForEach-Object { "<CHOICE>$_</CHOICE>" }) -join ''
            $defaultXml = if ($Field.default) { "<Default>$($Field.default)</Default>" } else { '' }
            $reqAttr    = if ($required) { 'Required="TRUE"' } else { '' }
            $xml = "<Field Type='Choice' Name='$($Field.internalName)' StaticName='$($Field.internalName)' DisplayName='$($Field.displayName)' Format='Dropdown' $reqAttr><CHOICES>$choicesXml</CHOICES>$defaultXml</Field>"
            Add-PnPFieldFromXml -List $List -FieldXml $xml | Out-Null
        }
        'Note' {
            Add-PnPField -List $List -DisplayName $Field.displayName -InternalName $Field.internalName -Type Note -Required:$required | Out-Null
        }
        'Number' {
            $f = Add-PnPField -List $List -DisplayName $Field.displayName -InternalName $Field.internalName -Type Number -Required:$required
            if ($f -and $Field.default) { Set-PnPField -List $List -Identity $Field.internalName -Values @{ DefaultValue = $Field.default } | Out-Null }
        }
        'DateTime' {
            Add-PnPField -List $List -DisplayName $Field.displayName -InternalName $Field.internalName -Type DateTime -Required:$required | Out-Null
        }
        'Boolean' {
            $defaultStr = if ($Field.default -eq $true) { '1' } else { '0' }
            $xml = "<Field Type='Boolean' Name='$($Field.internalName)' StaticName='$($Field.internalName)' DisplayName='$($Field.displayName)'><Default>$defaultStr</Default></Field>"
            Add-PnPFieldFromXml -List $List -FieldXml $xml | Out-Null
        }
        'URL' {
            Add-PnPField -List $List -DisplayName $Field.displayName -InternalName $Field.internalName -Type URL -Required:$required | Out-Null
        }
        'Calculated' {
            $outType  = if ($Field.outputType) { $Field.outputType } else { 'Text' }
            $formula  = $Field.formula
            $xml = "<Field Type='Calculated' ResultType='$outType' Name='$($Field.internalName)' StaticName='$($Field.internalName)' DisplayName='$($Field.displayName)'><Formula>$formula</Formula></Field>"
            Add-PnPFieldFromXml -List $List -FieldXml $xml | Out-Null
        }
        Default {
            $f = Add-PnPField -List $List -DisplayName $Field.displayName -InternalName $Field.internalName -Type Text -Required:$required
            if ($f -and $Field.indexed -eq $true) {
                try { Set-PnPField -List $List -Identity $Field.internalName -Values @{ Indexed = $true } | Out-Null } catch {}
            }
        }
    }
    Write-Host "    + field $($Field.internalName) ($($Field.type))"
}

# Document libraries
foreach ($libDef in $schema.documentLibraries) {
    $lib = Ensure-List -Definition $libDef -Template 'DocumentLibrary'
    if ($libDef.fields) {
        foreach ($f in $libDef.fields) { Ensure-Field -List $lib -Field $f }
    }
}

# Custom lists
foreach ($listDef in $schema.lists) {
    $list = Ensure-List -Definition $listDef -Template 'GenericList'
    foreach ($f in $listDef.fields) { Ensure-Field -List $list -Field $f }
}

# -------------------------------------------------------------------
# 3) Seed data
# -------------------------------------------------------------------
$seedDir = Join-Path $here 'SeedData'
$seedFiles = Get-ChildItem -Path $seedDir -Filter '*.json' | Sort-Object Name

foreach ($file in $seedFiles) {
    $payload = Get-Content -Raw -LiteralPath $file.FullName | ConvertFrom-Json
    $listTitle = $payload.list
    $items = $payload.items

    Write-Host "Seeding '$listTitle' (file: $($file.Name)) ..." -ForegroundColor Cyan

    if ($ReseedData) {
        Write-Host "  -ReseedData: removing existing items ..." -ForegroundColor Yellow
        Get-PnPListItem -List $listTitle -PageSize 500 | ForEach-Object {
            Remove-PnPListItem -List $listTitle -Identity $_.Id -Force | Out-Null
        }
    } else {
        $count = (Get-PnPListItem -List $listTitle -PageSize 5).Count
        if ($count -gt 0) {
            Write-Host "  Already has items — skipped (use -ReseedData to overwrite)." -ForegroundColor DarkGray
            continue
        }
    }

    foreach ($it in $items) {
        $values = @{}
        foreach ($prop in $it.PSObject.Properties) {
            $val = $prop.Value
            # URL fields → SharePoint expects "url, description" or a URL field value
            if ($prop.Name -eq 'DocUrl' -and $val) {
                $values[$prop.Name] = "$val, $val"
            } else {
                $values[$prop.Name] = $val
            }
        }
        Add-PnPListItem -List $listTitle -Values $values | Out-Null
    }
    Write-Host "  + $($items.Count) items inserted." -ForegroundColor Green
}

# -------------------------------------------------------------------
# 4) Upload assets + ASPX
# -------------------------------------------------------------------
$assetsDir = Join-Path $root 'Assets'
$pagesDir  = Join-Path $root 'Pages'
$targetFolder = "AIHubAssets/AIHub"

# Ensure subfolder exists in AIHubAssets
try { Resolve-PnPFolder -SiteRelativePath $targetFolder -ErrorAction Stop | Out-Null } catch { Add-PnPFolder -Folder 'AIHubAssets' -Name 'AIHub' | Out-Null }

$uploads = @(
    @{ src = (Join-Path $assetsDir 'aihub.css');       name = 'aihub.css'       },
    @{ src = (Join-Path $assetsDir 'aihub-data.js');   name = 'aihub-data.js'   },
    @{ src = (Join-Path $assetsDir 'aihub.js');        name = 'aihub.js'        },
    @{ src = (Join-Path $pagesDir  'AIHub-Content.html'); name = 'AIHub-Content.html' },
    @{ src = (Join-Path $pagesDir  'AIHub.aspx');         name = 'AIHub.aspx'         },
    @{ src = (Join-Path $pagesDir  'AIHub-WebPart.aspx'); name = 'AIHub-WebPart.aspx' }
)

Write-Host "Uploading assets and pages to '$targetFolder' ..." -ForegroundColor Cyan
foreach ($u in $uploads) {
    if (-not (Test-Path -LiteralPath $u.src)) { Write-Warning "  missing $($u.src)"; continue }
    Add-PnPFile -Path $u.src -Folder $targetFolder -NewFileName $u.name | Out-Null
    Write-Host "  + $($u.name)"
}

# -------------------------------------------------------------------
# 5) Modern page (Variant C) — optional
# -------------------------------------------------------------------
if (-not $SkipModernPage) {
    Write-Host "Creating Modern Page 'AIHub' with Embed Web Part ..." -ForegroundColor Cyan
    try {
        $page = Add-PnPPage -Name 'AIHub' -LayoutType Article -Force
        $relativeAssets = ([Uri]$SiteUrl).AbsolutePath.TrimEnd('/') + '/SiteAssets/AIHub/AIHub-Content.html'
        $iframeHtml     = "<iframe src='$relativeAssets' style='width:100%;min-height:1400px;border:0' loading='lazy'></iframe>"
        Add-PnPPageWebPart -Page 'AIHub' -DefaultWebPartType Embed -WebPartProperties @{ embedCode = $iframeHtml } | Out-Null
        Set-PnPPage -Identity 'AIHub' -Publish | Out-Null
        Write-Host "  + Modern page published: SitePages/AIHub.aspx" -ForegroundColor Green
    } catch {
        Write-Warning "Modern page creation failed: $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "AI Hub provisioning complete." -ForegroundColor Cyan
Write-Host "Variant A (Classic):  $SiteUrl/SiteAssets/AIHub/AIHub.aspx"
Write-Host "Variant B (WebPart):  $SiteUrl/SiteAssets/AIHub/AIHub-WebPart.aspx"
Write-Host "Variant C (Modern):   $SiteUrl/SitePages/AIHub.aspx"
Disconnect-PnPOnline
