<%-- ===========================================================
     AIHub-WebPart.aspx — Classic Web Part Page (Variant B)
     Embeds a Content Editor Web Part that loads AIHub-Content.html.
     Hosting: upload to SiteAssets/AIHub/.
     URL: <site>/SiteAssets/AIHub/AIHub-WebPart.aspx
     =========================================================== --%>
<%@ Page Language="C#"
         Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage,Microsoft.SharePoint,Version=16.0.0.0,Culture=neutral,PublicKeyToken=71e9bce111e9429c"
         MasterPageFile="~masterurl/default.master" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<asp:Content ContentPlaceHolderID="PlaceHolderPageTitle" runat="server">AI Hub (Web Part)</asp:Content>
<asp:Content ContentPlaceHolderID="PlaceHolderPageTitleInTitleArea" runat="server">AI Hub</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
  <WebPartPages:WebPartZone runat="server" Title="AIHubZone" ID="AIHubZone" FrameType="None" Orientation="Vertical">
    <ZoneTemplate>
      <WebPartPages:ContentEditorWebPart runat="server"
            __WebPartId="{11111111-1111-1111-1111-111111111111}"
            ID="aiHubContent">
        <WebPart xmlns="http://schemas.microsoft.com/WebPart/v2">
          <Title>AI Hub</Title>
          <FrameType>None</FrameType>
          <Description>Loads the AI Hub single-page app HTML.</Description>
          <IsIncluded>true</IsIncluded>
          <ZoneID>AIHubZone</ZoneID>
          <PartOrder>1</PartOrder>
          <FrameState>Normal</FrameState>
          <Height />
          <Width />
          <AllowRemove>true</AllowRemove>
          <AllowZoneChange>true</AllowZoneChange>
          <AllowMinimize>true</AllowMinimize>
          <AllowConnect>true</AllowConnect>
          <AllowEdit>true</AllowEdit>
          <AllowHide>true</AllowHide>
          <IsVisible>true</IsVisible>
          <DetailLink />
          <HelpLink />
          <HelpMode>Modeless</HelpMode>
          <Dir>Default</Dir>
          <PartImageSmall />
          <MissingAssembly>Cannot import this Web Part.</MissingAssembly>
          <PartImageLarge />
          <IsIncludedFilter />
          <Assembly>Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c</Assembly>
          <TypeName>Microsoft.SharePoint.WebPartPages.ContentEditorWebPart</TypeName>
          <ContentLink xmlns="http://schemas.microsoft.com/WebPart/v2/ContentEditor">../AIHubAssets/AIHub-Content.html</ContentLink>
          <Content xmlns="http://schemas.microsoft.com/WebPart/v2/ContentEditor" />
          <PartStorage xmlns="http://schemas.microsoft.com/WebPart/v2/ContentEditor" />
        </WebPart>
      </WebPartPages:ContentEditorWebPart>
    </ZoneTemplate>
  </WebPartPages:WebPartZone>
</asp:Content>
