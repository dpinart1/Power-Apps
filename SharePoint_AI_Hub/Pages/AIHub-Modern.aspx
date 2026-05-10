<%-- ===========================================================
     AIHub-Modern.aspx — Modern SitePage (Variant C, RECOMMENDED)
     Hosts the AI Hub via a Modern Page with an Embed Web Part.
     Created via PnP.PowerShell (Add-PnPClientSidePage), this file
     is NOT uploaded directly. It documents the ClientSidePage
     instructions for the provisioning script.
     =========================================================== --%>

<%--
   PROVISIONING (executed by Provision-AIHub.ps1):

   $page = Add-PnPPage -Name "AIHub" -LayoutType Article -PromoteAs None -Force
   Add-PnPPageSection -Page $page -SectionTemplate OneColumn -Order 1
   Add-PnPPageWebPart -Page $page -DefaultWebPartType "Embed" `
       -WebPartProperties @{
           "embedCode"  = "<iframe src='/sites/<SITE>/SiteAssets/AIHub/AIHub-Content.html' style='width:100%;min-height:1400px;border:0' loading='lazy'></iframe>";
           "shouldScaleWidth" = $false
       }
   Set-PnPPage -Identity "AIHub" -Publish

   Resulting URL: /sites/<SITE>/SitePages/AIHub.aspx
   Works on tenants where NoScriptSite is enabled (Embed Web Part allows iframes by default
   for same-tenant URLs that are listed under Tenant Settings → Allowed Domains).
--%>

<asp:Literal runat="server" Text="See header for provisioning instructions." />
