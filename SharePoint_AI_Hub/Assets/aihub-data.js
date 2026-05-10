/* ============================================================
   AI Hub — Data layer config
   Maps SharePoint list names + field names to in-memory keys.
   Loaded BEFORE aihub.js. Adjust if list names change.
   ============================================================ */

(function (global) {
  'use strict';

  // Resolve site base URL: prefer SP page context, fall back to current origin/path.
  function resolveWebUrl() {
    if (global._spPageContextInfo && global._spPageContextInfo.webAbsoluteUrl) {
      return global._spPageContextInfo.webAbsoluteUrl;
    }
    // Best-effort fallback when page is loaded outside SP page context (e.g., direct preview).
    var loc = global.location;
    return loc.origin + loc.pathname.replace(/\/(SiteAssets|SitePages)\/.*$/, '');
  }

  var WEB_URL = resolveWebUrl();
  var LIST_PREFIX = 'AIHub_';

  /**
   * One entry per SharePoint list. The renderer in aihub.js expects each
   * entry to expose: list (SP title), select (REST $select), order (REST
   * $orderby), key (target key in window.AIHub.data[lang]), and map
   * (function: SP item -> in-memory shape).
   */
  var LISTS = [
    {
      list: LIST_PREFIX + 'I18nStrings',
      key: 'i18n',
      select: 'Title,Key,Value,Language',
      order: 'Key',
      isDictionary: true,
      map: function (i) { return [i.Key, i.Value || '']; }
    },
    {
      list: LIST_PREFIX + 'Navigation',
      key: 'nav',
      select: 'Title,NavKey,Label,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return { id: i.NavKey, label: i.Label, emoji: i.Title || '', restricted: i.NavKey === 'steuerung' };
      }
    },
    {
      list: LIST_PREFIX + 'KPIs',
      key: 'kpis',
      select: 'Title,KPIKey,Value,Label,Target,Color,Progress,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return {
          key: i.KPIKey,
          value: i.Value,
          label: i.Label,
          target: i.Target,
          color: i.Color || 'var(--accent-1)',
          progress: Number(i.Progress) || 0
        };
      }
    },
    {
      list: LIST_PREFIX + 'News',
      key: 'news',
      select: 'Title,Tag,NewsDate,Color,IsHot,SortOrder,Language',
      order: 'NewsDate desc',
      map: function (i) {
        return {
          title: i.Title,
          tag: i.Tag,
          date: i.NewsDate,
          color: i.Color || 'var(--accent-3)',
          hot: !!i.IsHot
        };
      }
    },
    {
      list: LIST_PREFIX + 'PromptOfWeek',
      key: 'promptWeek',
      select: 'Title,Category,PromptText,WeekISO,Language',
      order: 'WeekISO desc',
      single: true,
      map: function (i) {
        return { title: i.Title, category: i.Category, text: i.PromptText, week: i.WeekISO };
      }
    },
    {
      list: LIST_PREFIX + 'AssessmentQuestions',
      key: 'aq',
      select: 'Title,QKey,Question,Opt1Label,Opt1Score,Opt2Label,Opt2Score,Opt3Label,Opt3Score,Opt4Label,Opt4Score,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return {
          key: i.QKey,
          q: i.Question || i.Title,
          opts: [
            { label: i.Opt1Label, score: Number(i.Opt1Score) || 0 },
            { label: i.Opt2Label, score: Number(i.Opt2Score) || 0 },
            { label: i.Opt3Label, score: Number(i.Opt3Score) || 0 },
            { label: i.Opt4Label, score: Number(i.Opt4Score) || 0 }
          ]
        };
      }
    },
    {
      list: LIST_PREFIX + 'LearningPaths',
      key: 'learn',
      select: 'Title,PathKey,LevelInternal,LevelLabel,Hours,Provider,Description,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return {
          title: i.Title,
          level: i.LevelInternal,
          levelLabel: i.LevelLabel,
          hours: i.Hours,
          provider: i.Provider,
          description: i.Description
        };
      }
    },
    {
      list: LIST_PREFIX + 'UseCases',
      key: 'ucsData',
      select: 'Title,UCKey,Department,StatusInternal,PhaseInternal,ImpactInternal,ROI,Description,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return {
          title: i.Title,
          dept: i.Department,
          st: i.StatusInternal,
          phase: i.PhaseInternal,
          impact: i.ImpactInternal,
          roi: i.ROI,
          desc: i.Description
        };
      }
    },
    {
      list: LIST_PREFIX + 'Prompts',
      key: 'prompts',
      select: 'Title,PromptKey,Category,PromptText,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return { title: i.Title, category: i.Category, text: i.PromptText };
      }
    },
    {
      list: LIST_PREFIX + 'Resources',
      key: 'resources',
      select: 'Title,Emoji,ResTitle,Description,Color,Source,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return {
          emoji: i.Emoji || '📘',
          title: i.ResTitle || i.Title,
          desc: i.Description,
          color: i.Color || 'var(--accent-1)',
          source: i.Source
        };
      }
    },
    {
      list: LIST_PREFIX + 'GovFAQ',
      key: 'faq',
      select: 'Title,Question,Answer,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) { return { q: i.Question || i.Title, a: i.Answer }; }
    },
    {
      list: LIST_PREFIX + 'GovDocs',
      key: 'docs',
      select: 'Title,DocTitle,DocUrl,Icon,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        var url = i.DocUrl && i.DocUrl.Url ? i.DocUrl.Url : (i.DocUrl || '#');
        return { title: i.DocTitle || i.Title, url: url, icon: i.Icon || '📄' };
      }
    },
    {
      list: LIST_PREFIX + 'GovRoadmap',
      key: 'roadmap',
      select: 'Title,Quarter,Milestone,StatusInternal,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return {
          quarter: i.Quarter,
          title: i.Title,
          milestone: i.Milestone,
          status: i.StatusInternal || 'planned'
        };
      }
    },
    {
      list: LIST_PREFIX + 'GovBlocks',
      key: 'govBlocks',
      select: 'Title,BlockTitle,BlockText,Icon,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return { title: i.BlockTitle || i.Title, text: i.BlockText, icon: i.Icon || '🛡️' };
      }
    },
    {
      list: LIST_PREFIX + 'Events',
      key: 'events',
      select: 'Title,EventDate,EventTime,Location,TypeInternal,Color,SortOrder,Language',
      order: 'EventDate',
      map: function (i) {
        return {
          title: i.Title,
          date: i.EventDate,
          time: i.EventTime,
          location: i.Location,
          type: i.TypeInternal,
          color: i.Color || 'var(--accent-1)'
        };
      }
    },
    {
      list: LIST_PREFIX + 'Risks',
      key: 'risks',
      select: 'Title,LevelInternal,Owner,DueDate,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return {
          title: i.Title,
          level: i.LevelInternal,
          owner: i.Owner,
          due: i.DueDate
        };
      }
    },
    {
      list: LIST_PREFIX + 'Phases',
      key: 'phases',
      select: 'Title,PhaseName,Budget,StatusInternal,Progress,ItemsJson,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        var items = [];
        try { items = i.ItemsJson ? JSON.parse(i.ItemsJson) : []; } catch (e) { items = []; }
        return {
          name: i.PhaseName || i.Title,
          budget: i.Budget,
          status: i.StatusInternal || 'planned',
          progress: Number(i.Progress) || 0,
          items: items
        };
      }
    },
    {
      list: LIST_PREFIX + 'SteeringKPIs',
      key: 'stkpis',
      select: 'Title,KPIKey,Value,Label,Target,Color,Progress,Trend,SortOrder,Language',
      order: 'SortOrder',
      map: function (i) {
        return {
          key: i.KPIKey,
          value: i.Value,
          label: i.Label,
          target: i.Target,
          color: i.Color || 'var(--accent-1)',
          progress: Number(i.Progress) || 0,
          trend: i.Trend || ''
        };
      }
    }
  ];

  global.AIHubData = {
    webUrl: WEB_URL,
    listPrefix: LIST_PREFIX,
    lists: LISTS
  };
})(typeof window !== 'undefined' ? window : this);
