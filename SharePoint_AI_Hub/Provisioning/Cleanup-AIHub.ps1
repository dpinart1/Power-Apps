<#
.SYNOPSIS
    Removes the AI Hub solution from a SharePoint Online site.

.DESCRIPTION
    Idempotent rollback: deletes all AIHub_* lists, the AIHubAssets and
    AIHub_Policies libraries, and the Modern page if it exists.

.PARAMETER SiteUrl
    Target SharePoint Online site URL.

.PARAMETER Force
    Skip confirmation prompt.

.EXAMPLE
    .\Cleanup-AIHub.ps1 -SiteUrl https://contoso.sharepoint.com/sites/AIHub -Force
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $SiteUrl,

    [switch] $Force
)

$ErrorActionPreference = 'Stop'

if (-not $Force) {
    $r = Read-Host "DELETE all AIHub_* lists, AIHubAssets, AIHub_Policies, SitePages/AIHub.aspx on $SiteUrl ? (yes/no)"
    if ($r -ne 'yes') { Write-Host "Aborted."; return }
}

Import-Module PnP.PowerShell -ErrorAction Stop
Connect-PnPOnline -Url $SiteUrl -Interactive

$targets = @(
    'AIHub_I18nStrings','AIHub_Navigation','AIHub_KPIs','AIHub_News','AIHub_PromptOfWeek',
    'AIHub_AssessmentQuestions','AIHub_LearningPaths','AIHub_UseCases','AIHub_Prompts',
    'AIHub_Resources','AIHub_GovFAQ','AIHub_GovDocs','AIHub_GovRoadmap','AIHub_GovBlocks',
    'AIHub_Events','AIHub_Risks','AIHub_Phases','AIHub_SteeringKPIs',
    'AIHubAssets','AIHub_Policies'
)

foreach ($t in $targets) {
    $list = Get-PnPList -Identity $t -ErrorAction SilentlyContinue
    if ($list) {
        Write-Host "Removing '$t' ..." -ForegroundColor Yellow
        Remove-PnPList -Identity $t -Force | Out-Null
    } else {
        Write-Host "Skip '$t' — not found." -ForegroundColor DarkGray
    }
}

# Remove Modern page if present
try {
    $page = Get-PnPPage -Identity 'AIHub' -ErrorAction SilentlyContinue
    if ($page) {
        Remove-PnPPage -Identity 'AIHub' -Force
        Write-Host "Removed Modern page SitePages/AIHub.aspx." -ForegroundColor Yellow
    }
} catch { }

Write-Host "Cleanup complete." -ForegroundColor Cyan
Disconnect-PnPOnline
