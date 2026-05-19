// ==UserScript==
// @name         Workflow Centralization & Audit Tool
// @namespace    http://tampermonkey.net/
// @version      4.1.0
// @description  Automates repetitive QA workflow by centralizing 30+ internal databases into a single draggable UI. Includes dynamic SPA auto-fill.
// @author       Shedron Hall
// @license      MIT
// @match        *://*/*
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// ==/UserScript==

(function () {
'use strict';

// BUSINESS IMPACT: This script centralizes fragmented workflows, reducing handling time 
// by opening context-specific internal tools simultaneously with pre-filled parameters.

var SCRIPT_META = {
    project: 'Workflow Centralization Tool',
    author:  'Shedron Hall',
    version: '4.1.0'
};
console.log('[' + SCRIPT_META.project + '] v' + SCRIPT_META.version + ' — loaded successfully  ✅ ');

var DEFAULT_SETTINGS = {
    theme:                  'dark',
    buttonColor:            '#0052cc',
    buttonHoverColor:       '#003d99',
    defaultMarketplace:     'AUTO',
    lastUsedMarketplace:    '',
    defaultCheckedFolders:  [0],
    openInBackground:       true,
    autoDetectItemID:       true,
    widgetPosition:         'right'
};

// TECHNICAL SKILL: LocalStorage state management across multiple browser tabs
function loadSettings() {
    try {
        var saved = GM_getValue('workflow_tool_settings', null);
        if (saved) {
            var parsed = JSON.parse(saved);
            for (var key in DEFAULT_SETTINGS) {
                if (!DEFAULT_SETTINGS.hasOwnProperty(key)) continue;
                if (!(key in parsed)) parsed[key] = DEFAULT_SETTINGS[key];
            }
            return parsed;
        }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function saveSettings(s) {
    GM_setValue('workflow_tool_settings', JSON.stringify(s));
}

var SETTINGS = loadSettings();

// SANITIZED: Genericized regional configurations and removed internal database hashes
var MARKETPLACE_CONFIG = {
    US: { domain: 'com',        mpId: '101',  region: 'na', internalHash: 'HASH_NA_01',  flag: ' 🇺🇸 ' },
    CA: { domain: 'ca',         mpId: '102',  region: 'na', internalHash: 'HASH_NA_02',  flag: ' 🇨🇦 ' },
    UK: { domain: 'co.uk',      mpId: '201',  region: 'eu', internalHash: 'HASH_EU_01',  flag: ' 🇬🇧 ' },
    DE: { domain: 'de',         mpId: '202',  region: 'eu', internalHash: 'HASH_EU_02',  flag: ' 🇩🇪 ' },
    JP: { domain: 'co.jp',      mpId: '301',  region: 'fe', internalHash: 'HASH_FE_01',  flag: ' 🇯🇵 ' }
};

// SANITIZED: Replaced proprietary endpoints with generic representations of the architecture
var TOOL_DEFINITIONS = {
    attribute_db: { label: ' 🔍  Attribute Database', desc: 'Core product data', url: function(id, mp) { return 'https://internal-db.example.com/search?id=' + id + '&region=' + mp.mpId; } },
    hierarchy_viewer: { label: ' 🪜  Hierarchy Viewer', desc: 'Parent/Child mapping', url: function(id, mp) { return 'https://internal-hierarchy.example.com/viewer/' + mp.mpId + '/nodes/'; } },
    historical_data: { label: ' ⏱️  Historical Timeline', desc: '6-month data rollback', url: function(id, mp) { 
        var now = new Date(); var past = new Date(now); past.setMonth(past.getMonth() - 6); 
        var fmt = function(d) { return d.toISOString().split('.')[0] + 'Z'; }; 
        return 'https://internal-history.example.com/query/' + fmt(past) + '/' + fmt(now) + '/?item=' + id; 
    }},
    media_central: { label: ' 🎬  Media Assets', desc: 'Product imagery', url: function(id) { return 'https://internal-media.example.com/images?id=' + id; } },
    compliance_check: { label: ' 🛡️  Compliance Dashboard', desc: 'Safety metrics', url: function(id, mp) { return 'https://internal-compliance.example.com/verify?id=' + id; } },
    image_debugger: { label: ' 🖼️  Image Debugger', desc: 'Resolution check', url: function(id, mp) { return 'https://internal-variations.example.com/debugger/#id=' + id; } },
    guidelines_wiki: { label: ' 📄  SOP Repository', desc: 'Standard Operating Procedures', url: function() { return 'https://internal-wiki.example.com/guidelines'; } }
};

var FOLDERS = [
    { name: 'Core Tools',       icon: '',    defaultOpen: true, tools: ['attribute_db','hierarchy_viewer','historical_data','media_central'] },
    { name: 'Compliance',       icon: ' 🧰 ', defaultOpen: false, tools: ['compliance_check','image_debugger'] },
    { name: 'Documentation',    icon: ' 📄 ', defaultOpen: false, tools: ['guidelines_wiki'] }
];

function isValidID(str) { return /^[A-Z0-9]{10}/.test(str.trim().toUpperCase()); }

// TECHNICAL SKILL: Dynamic context detection. Analyzes URL or DOM text to auto-populate tool parameters.
function detectIDFromURL() {
    if (!SETTINGS.autoDetectItemID) return '';
    var url = window.location.href;
    var patterns = [ /\/item\/([A-Z0-9]{10})/i, /[?&]id=([A-Z0-9]{10})/i ];
    for (var i = 0; i < patterns.length; i++) {
        var match = url.match(patterns[i]);
        if (match) return match[1].toUpperCase();
    }
    return '';
}

// GUI INJECTION & STYLING
GM_addStyle(
    '#custom-workflow-modal { position:fixed; z-index:1000000; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5) !important; display:flex !important; align-items:center; justify-content:center; }' +
    '#custom-workflow-box { background:#fff !important; color:#333 !important; border-radius:10px; padding:28px 32px; width:520px; box-shadow:0 8px 32px rgba(0,0,0,0.22); font-family:sans-serif; position:relative; }' +
    '#custom-workflow-box h2 { cursor:move; user-select:none; color:#0052cc; font-size: 18px; font-weight: bold; }' +
    '#workflow-float-btn { position:fixed; z-index:999998; background:#0052cc; color:#fff; border:none; padding:14px 22px; font-size:16px; font-weight:bold; cursor:pointer; box-shadow:0 6px 16px rgba(0,0,0,0.3); border-radius: 10px 0 0 10px; right:0; top:50%; transform:translateY(-50%); }'
);

function showManualModal() {
    if (document.getElementById('custom-workflow-modal')) return;

    var modal = document.createElement('div');
    modal.id = 'custom-workflow-modal';
    modal.innerHTML = '<div id="custom-workflow-box"><h2> 🔎 Workflow Centralization</h2><p>UI rendering logic executed here...</p><button id="close-modal">Close</button></div>';
    document.body.appendChild(modal);

    document.getElementById('close-modal').addEventListener('click', function() { modal.remove(); });

    // === DRAG LOGIC ===
    var box = document.getElementById('custom-workflow-box');
    var handle = box.querySelector('h2');
    var isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

    handle.addEventListener("mousedown", function(e) {
        initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; isDragging = true;
    });
    document.addEventListener("mouseup", function() { isDragging = false; });
    document.addEventListener("mousemove", function(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX; currentY = e.clientY - initialY;
            xOffset = currentX; yOffset = currentY;
            box.style.transform = "translate(" + currentX + "px, " + currentY + "px)";
        }
    });
}

var floatBtn = document.createElement('button');
floatBtn.id = 'workflow-float-btn';
floatBtn.textContent = ' 🔎  Audit Tools';
floatBtn.addEventListener('click', showManualModal);
document.body.appendChild(floatBtn);

// =====================================================================
// MODULE: SINGLE PAGE APPLICATION (SPA) AUTO-FILL
// BUSINESS IMPACT: Saves hundreds of hours by eliminating manual data entry in legacy systems.
// =====================================================================
(function dynamicAppAutoFill() {
    if (!window.location.hostname.includes('internal-tool')) return;

    var urlParams = new URLSearchParams(window.location.search);
    var itemID = (urlParams.get('id') || '').toUpperCase();
    if (!itemID) return;

    function setReactInputValue(inp, value) {
        try {
            var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(inp, value);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        } catch (e) { return false; }
    }

    function attemptAutoFill() {
        var allInputs = document.querySelectorAll('input[type="text"], input[type="search"]');
        for (var i = 0; i < allInputs.length; i++) {
            var inp = allInputs[i];
            if (inp.placeholder.toLowerCase().includes('id') || inp.name.toLowerCase().includes('item')) {
                setReactInputValue(inp, itemID);
                return true;
            }
        }
        return false;
    }

    var observer = new MutationObserver(function(mutations, obs) {
        if (attemptAutoFill()) {
            obs.disconnect(); 
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function() { observer.disconnect(); }, 15000); 
})();

})();
