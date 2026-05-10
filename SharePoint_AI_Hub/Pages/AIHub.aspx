<%-- ===========================================================
     AIHub.aspx — Standalone Classic-Style Page (Variant A)
     Hosting: upload to SiteAssets/AIHub/.
     Requires Set-PnPSite -NoScriptSite:$false on the site.
     URL: <site>/SiteAssets/AIHub/AIHub.aspx
     =========================================================== --%>
<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage,Microsoft.SharePoint,Version=16.0.0.0,Culture=neutral,PublicKeyToken=71e9bce111e9429c"
         MasterPageFile="~masterurl/default.master" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<asp:Content ContentPlaceHolderID="PlaceHolderPageTitle" runat="server">
  AI Hub
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
  <SharePoint:ScriptLink Name="sp.js" runat="server" OnDemand="true" Localizable="false" />
  <SharePoint:CssRegistration Name="~siteCollection/SiteAssets/AIHub/aihub.css" runat="server" />
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">
  AI Hub
</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
  <div id="loading" class="loading"><span class="loading-spinner"></span> Lade AI Hub …</div>

  <div id="app-shell" class="app" style="display:none">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark"></div>
        <span>AI Hub</span>
      </div>
      <div id="nav" class="nav"></div>
      <div id="lang-switch" class="lang-switch"></div>
    </aside>

    <main class="main" id="app-root">

      <section class="section active" data-section="home">
        <div class="hero">
          <div class="hero-card">
            <span class="pill" id="hero-pill"></span>
            <h1 class="h1" id="hero-h1"></h1>
            <p class="subline" id="hero-subline"></p>
            <div class="search-bar">
              <span>&#128269;</span>
              <input id="hero-search" type="text" />
            </div>
          </div>
          <div class="ceo-card">
            <p class="ceo-quote" id="ceo-quote"></p>
            <div class="ceo-meta">
              <strong id="ceo-name"></strong>
              <span id="ceo-title"></span>
            </div>
          </div>
        </div>

        <h2 class="section-title" id="section-kpi-title"></h2>
        <div id="kpis" class="grid cols-3"></div>

        <h2 class="section-title" id="section-news-title"></h2>
        <div id="news" class="grid cols-4"></div>

        <h2 class="section-title" id="section-prompt-title"></h2>
        <div id="prompt-week"></div>

        <div class="cta-card">
          <div>
            <h3 id="cta-title"></h3>
            <p id="cta-sub"></p>
          </div>
          <button id="cta-btn"></button>
        </div>
      </section>

      <section class="section" data-section="empowerment">
        <h2 class="section-title">&#129504; Empowerment</h2>
        <div class="grid cols-2">
          <div>
            <h3 class="section-title">Self-Assessment</h3>
            <div class="assessment" id="assessment"></div>
          </div>
          <div>
            <h3 class="section-title">Lernpfade</h3>
            <div id="learn" class="grid cols-2"></div>
          </div>
        </div>
        <h3 class="section-title">Best-Practice-Prompts</h3>
        <div id="prompts" class="grid cols-2"></div>
      </section>

      <section class="section" data-section="usecases">
        <h2 class="section-title">&#9881;&#65039; Use Case Pipeline</h2>
        <div id="uc-filters" class="uc-filters" data-current="all"></div>
        <div id="use-cases" class="grid cols-3"></div>
      </section>

      <section class="section" data-section="wissen">
        <h2 class="section-title">&#128218; Wissen &amp; Ressourcen</h2>
        <div id="resources" class="grid cols-3"></div>
      </section>

      <section class="section" data-section="governance">
        <h2 class="section-title">&#128737;&#65039; Governance</h2>
        <div id="gov-blocks" class="grid cols-3"></div>
        <h3 class="section-title">Roadmap EU AI Act</h3>
        <div id="gov-roadmap" class="roadmap"></div>
        <h3 class="section-title">Dokumente &amp; Policies</h3>
        <div id="gov-docs" class="grid cols-3"></div>
        <h3 class="section-title">FAQ</h3>
        <div id="gov-faq" class="grid cols-2"></div>
      </section>

      <section class="section" data-section="events">
        <h2 class="section-title">&#128197; Events &amp; Termine</h2>
        <div id="events" class="grid cols-3"></div>
      </section>

      <section class="section" data-section="steuerung">
        <div id="restricted-banner" class="restricted-banner"></div>
        <h2 class="section-title">&#128202; Cockpit / Steuerung</h2>
        <div id="steering-kpis" class="grid cols-3"></div>
        <h3 class="section-title">Programm-Phasen</h3>
        <div id="phases" class="grid cols-3"></div>
        <h3 class="section-title">Risiken</h3>
        <div id="risks-table"></div>
      </section>

      <p id="footer" class="footer"></p>
    </main>
  </div>

  <script type="text/javascript" src="../AIHubAssets/aihub-data.js"></script>
  <script type="text/javascript" src="../AIHubAssets/aihub.js"></script>
</asp:Content>
