// --- START OF script.js (TimberTally v7) ---

// ============================================================
// SERVICE WORKER REGISTRATION & UPDATE HANDLING
// ============================================================
if ('serviceWorker' in navigator) {
    const updateNotification = document.getElementById('updateNotification');
    const updateNowBtn = document.getElementById('updateNowBtn');
    const updateDismissBtn = document.getElementById('updateDismissBtn');
    let newWorker;

    function showUpdateBar() {
        if (updateNotification) updateNotification.style.display = 'flex';
    }
    function hideUpdateBar() {
        if (updateNotification) updateNotification.style.display = 'none';
    }

    window.addEventListener('load', () => {
        try {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    if (registration.waiting) { newWorker = registration.waiting; showUpdateBar(); }
                    registration.addEventListener('updatefound', () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            if (!newWorker) newWorker = installingWorker;
                            installingWorker.addEventListener('statechange', () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    if (registration.waiting) newWorker = registration.waiting;
                                    showUpdateBar();
                                }
                            });
                        }
                    });
                    setInterval(() => registration.update().catch(() => {}), 3600000);
                })
                .catch(err => console.error('SW registration failed:', err));

            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) { window.location.reload(); refreshing = true; }
            });
        } catch (e) { console.error('SW setup error:', e); }

        if (updateNowBtn) {
            updateNowBtn.addEventListener('click', () => {
                if (newWorker) { newWorker.postMessage({ type: 'SKIP_WAITING' }); hideUpdateBar(); }
                else hideUpdateBar();
            });
        }
        if (updateDismissBtn) updateDismissBtn.addEventListener('click', hideUpdateBar);
    });
}

// ============================================================
// CHART.JS BACKGROUND PLUGIN
// ============================================================
if (typeof Chart !== 'undefined') {
    Chart.register({
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
            if (options?.color) {
                const { ctx } = chart;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = options.color;
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        }
    });
}

// ============================================================
// MAIN APPLICATION LOGIC
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM References ---
    const dbhSelect           = document.getElementById('dbhSelect');
    const dbhDisplay          = document.getElementById('dbhDisplay');
    const dbhDecBtn           = document.getElementById('dbhDecBtn');
    const dbhIncBtn           = document.getElementById('dbhIncBtn');
    const speciesSelect       = document.getElementById('speciesSelect');
    const logsSelect          = document.getElementById('logsSelect');
    const cutCheckbox         = document.getElementById('cutCheckbox');
    const ugsCheckbox         = document.getElementById('ugsCheckbox');
    const notesTextarea       = document.getElementById('notesTextarea');
    const getLocationBtn      = document.getElementById('getLocationBtn');
    // Notes tab
    const standNotesTextarea  = document.getElementById('standNotesTextarea');
    const clearNotesBtn       = document.getElementById('clearNotesBtn');
    const notesSavedStatus    = document.getElementById('notesSavedStatus');
    // Dark mode
    const darkModeSelect      = document.getElementById('darkModeSelect');
    // Install prompt
    const installBanner       = document.getElementById('installBanner');
    const installAcceptBtn    = document.getElementById('installAcceptBtn');
    const installDismissBtn   = document.getElementById('installDismissBtn');
    const installAppBtn       = document.getElementById('installAppBtn');
    const locationStatus      = document.getElementById('locationStatus');
    const submitBtn           = document.getElementById('submitBtn');
    const saveCsvBtn          = document.getElementById('saveCsvBtn');
    const deleteBtn           = document.getElementById('deleteBtn');
    const deleteAllBtn        = document.getElementById('deleteAllBtn');
    const entriesTableBody    = document.getElementById('entriesTableBody');
    const noEntriesRow        = document.getElementById('noEntriesRow');
    const entryCountSpan      = document.getElementById('entryCount');
    const feedbackMsg         = document.getElementById('feedbackMsg');
    const plotDecrementBtn    = document.getElementById('plotDecrementBtn');
    const plotIncrementBtn    = document.getElementById('plotIncrementBtn');
    const plotNumberDisplay   = document.getElementById('plotNumberDisplay');
    const neededPlotsValue    = document.getElementById('neededPlotsValue');
    const areaDecrementBtn    = document.getElementById('areaDecrementBtn');
    const areaIncrementBtn    = document.getElementById('areaIncrementBtn');
    const areaLetterDisplay   = document.getElementById('areaLetterDisplay');
    const settingsSection     = document.getElementById('settingsSection');
    const toggleSettingsBtn   = document.getElementById('toggleSettingsBtn');
    const bafSelect           = document.getElementById('bafSelect');
    const logRuleSelect       = document.getElementById('logRuleSelect');
    const formClassSelect     = document.getElementById('formClassSelect');
    const formClassGroup      = document.getElementById('formClassGroup');
    const generateGraphsSelect = document.getElementById('generateGraphsSelect');
    const settingsFeedback    = document.getElementById('settingsFeedback');
    const manualUpdateCheckBtn = document.getElementById('manualUpdateCheckBtn');
    const updateCheckStatus   = document.getElementById('updateCheckStatus');
    const showInfoBtn         = document.getElementById('showInfoBtn');
    const showTreeKeyBtn      = document.getElementById('showTreeKeyBtn');
    const newSpeciesInput     = document.getElementById('newSpeciesInput');
    const addSpeciesBtn       = document.getElementById('addSpeciesBtn');
    const removeSpeciesSelect = document.getElementById('removeSpeciesSelect');
    const removeSpeciesBtn    = document.getElementById('removeSpeciesBtn');
    const speciesMgmtFeedback = document.getElementById('speciesMgmtFeedback');
    const projectNameInput    = document.getElementById('projectNameInput');
    const saveProjectBtn      = document.getElementById('saveProjectBtn');
    const loadProjectSelect   = document.getElementById('loadProjectSelect');
    const loadProjectBtn      = document.getElementById('loadProjectBtn');
    const deleteProjectBtn    = document.getElementById('deleteProjectBtn');
    const csvFileInput        = document.getElementById('csvFileInput');
    const loadCsvBtn          = document.getElementById('loadCsvBtn');
    const projectMgmtFeedback = document.getElementById('projectMgmtFeedback');
    const showCompassBtn      = document.getElementById('showCompassBtn');
    const compassContainer    = document.getElementById('compassContainer');
    const compassNeedle       = document.getElementById('compassNeedle');
    const compassHeading      = document.getElementById('compassHeading');
    const compassSource       = document.getElementById('compassSource');
    const closeCompassBtn     = document.getElementById('closeCompassBtn');
    const treeKeyModal        = document.getElementById('treeKeyModal');
    const closeTreeKeyBtn     = document.getElementById('closeTreeKeyBtn');
    const closeTreeKeyBtnBottom = document.getElementById('closeTreeKeyBtnBottom');
    const autosaveStatus      = document.getElementById('autosaveStatus');
    const tallyAreaSelect     = document.getElementById('tallyAreaSelect');
    const tallySummaryCards   = document.getElementById('tallySummaryCards');
    const tallyResults        = document.getElementById('tallyResults');
    const tallyChartsContainer = document.getElementById('tallyChartsContainer');
    const calculateStockingBtn = document.getElementById('calculateStockingBtn');
    const stockingResults     = document.getElementById('stockingResults');
    const stockingStatsTable  = document.getElementById('stockingStatsTable');
    const stockingNoData      = document.getElementById('stockingNoData');
    const zipExportSelect     = document.getElementById('zipExportSelect');

    // --- Storage Keys ---
    const STORAGE_KEY          = 'timberTallyTempSession';
    const SPECIES_STORAGE_KEY  = 'timberTallyCustomSpecies';
    const PROJECTS_STORAGE_KEY = 'timberTallyProjects';
    const SETTINGS_STORAGE_KEY = 'timberTallySettings';
    const NOTES_STORAGE_KEY    = 'timberTallyStandNotes';

    // --- Constants ---
    const PRIVACY_POLICY_URL = 'https://timbertally.github.io/TimberTally/privacy.html';
    const README_URL         = 'https://github.com/TimberTally/TimberTally/blob/main/README.md';
    const MIN_PLOT_NUMBER    = 1;
    const MAX_PLOT_NUMBER    = 999;
    const areaLetters        = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

    // --- State ---
    let collectedData       = [];
    let currentLocation     = null;
    let savedProjects       = {};
    let currentPlotNumber   = 1;
    let currentAreaIndex    = 0;
    let currentBaf          = 10;
    let currentLogRule      = 'Doyle';
    let currentFormClass    = 78;
    let currentGenerateGraphs = 'No';
    let currentZipExport    = 'No';
    let currentDarkMode     = 'off';
    let deferredInstallPrompt = null;   // holds the beforeinstallprompt event
    let currentSpeciesList  = [];
    let autosaveTimer       = null;
    let lastAutosaveTime    = null;
    let autosaveInterval    = null;
    let stockingChartInstance = null;

    // Feedback timeout handles
    let feedbackTimeout = null, settingsFeedbackTimeout = null;
    let speciesFeedbackTimeout = null, projectFeedbackTimeout = null;
    let updateStatusTimeout = null;

    // Active tally chart instances
    let tallyChartInstances = [];

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    function showFeedbackMessage(element, message, isError, duration, timeoutHandle) {
        if (!element) return timeoutHandle;
        if (timeoutHandle) clearTimeout(timeoutHandle);
        element.textContent = message;
        element.className = isError ? 'feedback-message error' : 'feedback-message';
        element.style.display = 'block';
        void element.offsetWidth;
        element.style.opacity = 1;
        return setTimeout(() => {
            element.style.opacity = 0;
            setTimeout(() => { element.style.display = 'none'; }, 500);
        }, duration);
    }
    function showFeedback(msg, isError = false, dur = 2500) {
        feedbackTimeout = showFeedbackMessage(feedbackMsg, msg, isError, dur, feedbackTimeout);
    }
    function showSettingsFeedback(msg, isError = false) {
        settingsFeedbackTimeout = showFeedbackMessage(settingsFeedback, msg, isError, 2000, settingsFeedbackTimeout);
    }
    function showSpeciesFeedback(msg, isError = false) {
        speciesFeedbackTimeout = showFeedbackMessage(speciesMgmtFeedback, msg, isError, 2500, speciesFeedbackTimeout);
    }
    function showProjectFeedback(msg, isError = false, dur = 3000) {
        projectFeedbackTimeout = showFeedbackMessage(projectMgmtFeedback, msg, isError, dur, projectFeedbackTimeout);
    }

    // ============================================================
    // AUTOSAVE / SESSION
    // ============================================================
    function saveSessionData() {
        try {
            const state = { data: collectedData, plot: currentPlotNumber, areaIdx: currentAreaIndex };
            if (collectedData.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                lastAutosaveTime = new Date();
                updateAutosaveStatus();
            } else {
                localStorage.removeItem(STORAGE_KEY);
                if (autosaveStatus) autosaveStatus.textContent = '';
            }
        } catch (e) { console.error('[Session] Save error:', e); }
    }

    function updateAutosaveStatus() {
        if (!autosaveStatus || !lastAutosaveTime) return;
        const mins = Math.floor((new Date() - lastAutosaveTime) / 60000);
        if (mins < 1) autosaveStatus.textContent = '✓ Autosaved just now';
        else if (mins === 1) autosaveStatus.textContent = '✓ Autosaved 1 min ago';
        else autosaveStatus.textContent = `✓ Autosaved ${mins} min ago`;
    }

    function startAutosaveStatusUpdater() {
        if (autosaveInterval) clearInterval(autosaveInterval);
        autosaveInterval = setInterval(updateAutosaveStatus, 60000);
    }

    function loadAndPromptSessionData() {
        try {
            const json = localStorage.getItem(STORAGE_KEY);
            if (json) {
                const recovered = JSON.parse(json);
                const data = recovered?.data;
                if (Array.isArray(data) && data.length > 0) {
                    const lastPlot = recovered?.plot ?? 1;
                    const lastAreaIndex = recovered?.areaIdx ?? 0;
                    const n = data.length;
                    if (confirm(`Recover ${n} unsaved ${n === 1 ? 'entry' : 'entries'} from the last session? (Last Plot: ${lastPlot}, Last Area: ${areaLetters[lastAreaIndex]})`)) {
                        collectedData = data;
                        currentPlotNumber = lastPlot;
                        currentAreaIndex = lastAreaIndex;
                        lastAutosaveTime = new Date();
                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                        currentPlotNumber = 1; currentAreaIndex = 0;
                    }
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                    currentPlotNumber = 1; currentAreaIndex = 0;
                }
            } else {
                currentPlotNumber = 1; currentAreaIndex = 0;
            }
        } catch (e) {
            console.error('[Session] Load error:', e);
            localStorage.removeItem(STORAGE_KEY);
            currentPlotNumber = 1; currentAreaIndex = 0;
        }
        updatePlotDisplay(); updateAreaDisplay(); renderEntries();
        startAutosaveStatusUpdater();
    }

    // ============================================================
    // SETTINGS
    // ============================================================
    function updateFormClassVisibility() {
        if (!logRuleSelect || !formClassGroup) return;
        formClassGroup.hidden = (logRuleSelect.value !== 'Doyle');
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
                baf: currentBaf, logRule: currentLogRule,
                formClass: currentFormClass, generateGraphs: currentGenerateGraphs,
                zipExport: currentZipExport, darkMode: currentDarkMode
            }));
        } catch (e) { console.error('[Settings] Save error:', e); }
    }

    function loadSettings() {
        try {
            const json = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (json) {
                const s = JSON.parse(json);
                if (s && typeof s === 'object') {
                    currentBaf = parseInt(s.baf, 10) || 10;
                    currentLogRule = ['Doyle','Scribner','International'].includes(s.logRule) ? s.logRule : 'Doyle';
                    currentFormClass = parseInt(s.formClass, 10) || 78;
                    if (!VALID_DOYLE_FC.includes(currentFormClass)) currentFormClass = 78;
                    currentGenerateGraphs = s.generateGraphs === 'Yes' ? 'Yes' : 'No';
                    currentZipExport = s.zipExport === 'Yes' ? 'Yes' : 'No';
                    currentDarkMode = ['off','on','system'].includes(s.darkMode) ? s.darkMode : 'off';
                    if (bafSelect) bafSelect.value = String(currentBaf);
                    if (logRuleSelect) logRuleSelect.value = currentLogRule;
                    if (formClassSelect) formClassSelect.value = String(currentFormClass);
                    if (generateGraphsSelect) generateGraphsSelect.value = currentGenerateGraphs;
                    if (zipExportSelect) zipExportSelect.value = currentZipExport;
                    if (darkModeSelect) darkModeSelect.value = currentDarkMode;
                } else applyDefaultSettings();
            } else applyDefaultSettings();
        } catch (e) { applyDefaultSettings(); }
        applyDarkMode();
        if (settingsSection) settingsSection.hidden = true;
        if (toggleSettingsBtn) toggleSettingsBtn.setAttribute('aria-expanded', 'false');
        updateSaveBtnLabel();
    }

    function applyDefaultSettings() {
        currentBaf = 10; currentLogRule = 'Doyle'; currentFormClass = 78;
        currentGenerateGraphs = 'No'; currentZipExport = 'No'; currentDarkMode = 'off';
        if (bafSelect) bafSelect.value = '10';
        if (logRuleSelect) logRuleSelect.value = 'Doyle';
        if (formClassSelect) formClassSelect.value = '78';
        if (generateGraphsSelect) generateGraphsSelect.value = 'No';
        if (zipExportSelect) zipExportSelect.value = 'No';
        if (darkModeSelect) darkModeSelect.value = 'off';
        saveSettings();
    }

    function applyDarkMode() {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        const useDark = currentDarkMode === 'on' || (currentDarkMode === 'system' && prefersDark);
        document.body.classList.toggle('dark-mode', useDark);
    }

    function updateSaveBtnLabel() {
        if (saveCsvBtn) {
            if (currentZipExport === 'Yes') {
                saveCsvBtn.textContent = '\uD83D\uDCBE Save ZIP';
            } else if (currentGenerateGraphs === 'Yes') {
                saveCsvBtn.textContent = '\uD83D\uDCBE Save CSV & Graphs';
            } else {
                saveCsvBtn.textContent = '\uD83D\uDCBE Save CSV';
            }
        }
    }

    // ============================================================
    // SPECIES MANAGEMENT
    // ============================================================
    function saveSpeciesList() {
        try { localStorage.setItem(SPECIES_STORAGE_KEY, JSON.stringify(currentSpeciesList)); }
        catch (e) { console.error('[Species] Save error:', e); }
    }

    function populateSpeciesDropdowns() {
        if (!speciesSelect || !removeSpeciesSelect) return;
        const currentVal = speciesSelect.value;
        speciesSelect.innerHTML = '';
        removeSpeciesSelect.innerHTML = '';
        currentSpeciesList.sort((a, b) => a.localeCompare(b)).forEach(sp => {
            const o1 = document.createElement('option'); o1.value = o1.textContent = sp;
            const o2 = document.createElement('option'); o2.value = o2.textContent = sp;
            speciesSelect.appendChild(o1);
            removeSpeciesSelect.appendChild(o2);
        });
        if (currentSpeciesList.includes(currentVal)) speciesSelect.value = currentVal;
        else if (speciesSelect.options.length > 0) speciesSelect.selectedIndex = 0;
    }

    function initializeSpeciesManagement() {
        try {
            const json = localStorage.getItem(SPECIES_STORAGE_KEY);
            if (json) {
                const stored = JSON.parse(json);
                currentSpeciesList = Array.isArray(stored) && stored.every(s => typeof s === 'string')
                    ? stored : [...DEFAULT_SPECIES];
            } else {
                currentSpeciesList = [...DEFAULT_SPECIES];
                saveSpeciesList();
            }
        } catch (e) { currentSpeciesList = [...DEFAULT_SPECIES]; }
        populateSpeciesDropdowns();
    }

    // ============================================================
    // PROJECT MANAGEMENT
    // ============================================================
    function saveProjectsToStorage() {
        try { localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(savedProjects)); }
        catch (e) { console.error('[Projects] Save error:', e); }
    }

    function populateLoadProjectDropdown() {
        if (!loadProjectSelect) return;
        const currentVal = loadProjectSelect.value;
        loadProjectSelect.innerHTML = '<option value="">-- Select a project --</option>';
        const names = Object.keys(savedProjects).sort();
        names.forEach(name => {
            const o = document.createElement('option');
            o.value = o.textContent = name;
            loadProjectSelect.appendChild(o);
        });
        const has = names.length > 0;
        if (loadProjectBtn) loadProjectBtn.disabled = !has;
        if (deleteProjectBtn) deleteProjectBtn.disabled = !has;
        loadProjectSelect.disabled = !has;
        if (names.includes(currentVal)) loadProjectSelect.value = currentVal;
    }

    function initializeProjectManagement() {
        try {
            const json = localStorage.getItem(PROJECTS_STORAGE_KEY);
            if (json) {
                const parsed = JSON.parse(json);
                savedProjects = (typeof parsed === 'object' && parsed !== null) ? parsed : {};
            } else savedProjects = {};
        } catch (e) { savedProjects = {}; }
        populateLoadProjectDropdown();
    }

    // ============================================================
    // UI POPULATION & DISPLAY
    // ============================================================
    function updatePlotNumberAndAreaFromData() {
        let lastPlot = null, lastAreaIdx = null;
        for (let i = collectedData.length - 1; i >= 0; i--) {
            const e = collectedData[i];
            if (e?.plotNumber && lastPlot === null) {
                const n = parseInt(e.plotNumber, 10);
                if (!isNaN(n) && n >= MIN_PLOT_NUMBER && n <= MAX_PLOT_NUMBER) lastPlot = n;
            }
            if (e?.areaLetter && lastAreaIdx === null) {
                const idx = areaLetters.indexOf(e.areaLetter);
                if (idx !== -1) lastAreaIdx = idx;
            }
            if (lastPlot !== null && lastAreaIdx !== null) break;
        }
        currentPlotNumber = lastPlot ?? 1;
        currentAreaIndex  = lastAreaIdx ?? 0;
        updatePlotDisplay(); updateAreaDisplay();
    }

    // DBH stepper: hidden input holds value, display span shows it
    const DBH_MIN = 4, DBH_MAX = 40, DBH_STEP = 2;
    function setDbhValue(val) {
        const clamped = Math.max(DBH_MIN, Math.min(DBH_MAX, val));
        if (dbhSelect) dbhSelect.value = String(clamped);
        if (dbhDisplay) dbhDisplay.textContent = clamped + '"';
        if (dbhDecBtn) dbhDecBtn.disabled = clamped <= DBH_MIN;
        if (dbhIncBtn) dbhIncBtn.disabled = clamped >= DBH_MAX;
        checkAndSetLogsForDbh();
    }
    function populateDbhOptions() { setDbhValue(10); }  // init stepper to 10"

    function populateLogsOptions() {
        if (!logsSelect) return;
        logsSelect.innerHTML = '';
        ["0","0.5","1","1.5","2","2.5","3","3.5","4","4.5","5","5.5","6","Cull"].forEach(v => {
            const o = document.createElement('option');
            o.value = o.textContent = v;
            logsSelect.appendChild(o);
        });
        if (logsSelect.options.length > 0) logsSelect.selectedIndex = 0;
    }

    function checkAndSetLogsForDbh() {
        if (currentLogRule === 'Doyle' && dbhSelect && logsSelect) {
            if (['4','6','8','10'].includes(dbhSelect.value) && logsSelect.value !== '0' && logsSelect.value !== 'Cull') {
                const cur = parseFloat(logsSelect.value);
                if (!isNaN(cur) && cur > 0) {
                    logsSelect.value = '0';
                    showFeedback(`Logs set to 0 for DBH ${dbhSelect.value} (Doyle)`, false, 1500);
                }
            }
        }
    }

    function updatePlotDisplay() {
        if (plotNumberDisplay) plotNumberDisplay.textContent = currentPlotNumber;
        if (plotDecrementBtn) plotDecrementBtn.disabled = currentPlotNumber <= MIN_PLOT_NUMBER;
        if (plotIncrementBtn) plotIncrementBtn.disabled = currentPlotNumber >= MAX_PLOT_NUMBER;
    }

    function updateAreaDisplay() {
        if (areaLetterDisplay) areaLetterDisplay.textContent = areaLetters[currentAreaIndex];
        if (areaDecrementBtn) areaDecrementBtn.disabled = currentAreaIndex <= 0;
        if (areaIncrementBtn) areaIncrementBtn.disabled = currentAreaIndex >= areaLetters.length - 1;
    }

    function renderEntries() {
        if (!entriesTableBody || !entryCountSpan || !noEntriesRow || !saveCsvBtn || !deleteAllBtn || !deleteBtn) return;
        entriesTableBody.innerHTML = '';
        entryCountSpan.textContent = collectedData.length;
        const hasData = collectedData.length > 0;
        noEntriesRow.hidden = hasData;
        if (hasData) {
            collectedData.forEach((entry, idx) => {
                if (!entry.id) entry.id = Date.now() + idx;
            });
            for (let i = collectedData.length - 1; i >= 0; i--) {
                const e = collectedData[i];
                if (!e) continue;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" data-id="${e.id}"></td>
                    <td>${e.plotNumber ?? '?'}</td>
                    <td>${e.areaLetter ?? '?'}</td>
                    <td>${e.species ?? 'N/A'}</td>
                    <td>${e.dbh ?? '?'}</td>
                    <td>${e.logs ?? '?'}</td>
                    <td>${e.cutStatus || 'No'}</td>
                    <td>${e.ugsStatus || 'No'}</td>`;
                entriesTableBody.appendChild(tr);
            }
        }
        saveCsvBtn.disabled = !hasData;
        deleteAllBtn.disabled = !hasData;
        deleteBtn.disabled = !isAnyCheckboxChecked();
        updatePlotNumberAndAreaFromData();
        calculateAndDisplayNeededPlots();
    }

    function isAnyCheckboxChecked() {
        return entriesTableBody?.querySelector('input[type="checkbox"]:checked') !== null;
    }

    function calculateAndDisplayNeededPlots() {
        if (!neededPlotsValue) return;
        const letter = areaLetters[currentAreaIndex];
        const areaData = collectedData.filter(e => e.areaLetter === letter);
        const plotCount = new Set(areaData.map(e => e.plotNumber).filter(p => p != null)).size;
        const stats = calculatePlotStats(areaData, currentBaf, currentLogRule, currentFormClass);

        if (stats && plotCount >= 2 && stats.cvV > 0) {
            const cv = stats.cvV, t = 2;
            // Freese formula: n = ceil((t*CV/E)^2). Show 0/✓ if already met.
            const needed = (E) => {
                const n = Math.ceil(Math.pow(t * cv / E, 2));
                return plotCount >= n ? 0 : n;
            };
            const n10 = needed(10), n20 = needed(20), n30 = needed(30);
            const fmt = (n, label) => n === 0
                ? `<span style="color:#28a745;font-weight:700;">${label}:✓</span>`
                : `${label}:${n}`;
            neededPlotsValue.innerHTML = `${fmt(n10,'10%')} ${fmt(n20,'20%')} ${fmt(n30,'30%')}`;
        } else if (areaData.length > 0 && plotCount < 2) {
            neededPlotsValue.textContent = 'Need ≥2 plots';
        } else {
            neededPlotsValue.textContent = '---';
        }
    }

    // ============================================================
    // TALLY & STATS

    function displayTallyResults(tallyData) {
        if (!tallyResults) return;
        tallyResults.innerHTML = '';
        const speciesKeys = Object.keys(tallyData).sort();
        if (!speciesKeys.length) {
            tallyResults.innerHTML = '<p class="no-tally-data">No data to tally.</p>';
            return;
        }
        speciesKeys.forEach(species => {
            const div = document.createElement('div');
            div.classList.add('tally-species');
            div.innerHTML = `<h3>${species}</h3>`;
            const dbhKeys = Object.keys(tallyData[species]).sort((a,b) => Number(a)-Number(b));
            dbhKeys.forEach(dbh => {
                div.innerHTML += `<h4>DBH: ${dbh}"</h4>`;
                const logKeys = Object.keys(tallyData[species][dbh]).sort((a,b) => {
                    if (a==='Cull') return 1; if (b==='Cull') return -1;
                    const nA=parseFloat(a), nB=parseFloat(b);
                    return isNaN(nA)?1:isNaN(nB)?-1:nA-nB;
                });
                logKeys.forEach(logs => {
                    const counts = tallyData[species][dbh][logs];
                    const cut = counts['Yes'] || 0, notCut = counts['No'] || 0;
                    if (cut > 0) div.innerHTML += `<div class="tally-log-item"><span class="log-label">Logs: ${logs} (Cut)</span> — <span class="log-count">${cut}</span></div>`;
                    if (notCut > 0) div.innerHTML += `<div class="tally-log-item"><span class="log-label">Logs: ${logs} (Leave)</span> — <span class="log-count">${notCut}</span></div>`;
                });
            });
            tallyResults.appendChild(div);
        });
    }

    // ============================================================
    // STOCKING CHART (wrapper — rendering delegated to charts.js)
    // ============================================================
    function renderStockingChart() {
        const areaStats = calculateStandStocking(collectedData, currentBaf);
        if (!areaStats?.length) {
            if (stockingResults) stockingResults.style.display = 'none';
            if (stockingNoData) stockingNoData.style.display = 'block';
            return;
        }
        if (stockingNoData) stockingNoData.style.display = 'none';
        if (stockingResults) stockingResults.style.display = 'block';

        // Stats table
        if (stockingStatsTable) {
            let html = '<table><thead><tr><th>Area</th><th>Plots</th><th>Total TPA</th><th>Total BA/Ac</th><th>Cut TPA</th><th>Cut BA/Ac</th><th>Leave TPA</th><th>Leave BA/Ac</th></tr></thead><tbody>';
            areaStats.forEach(s => {
                html += `<tr>
                    <td><strong>${s.area}</strong></td>
                    <td>${s.numPlots}</td>
                    <td>${s.totalTpa.toFixed(1)}</td>
                    <td>${s.totalBa.toFixed(1)}</td>
                    <td>${s.cutTpa.toFixed(1)}</td>
                    <td>${s.cutBa.toFixed(1)}</td>
                    <td>${s.leaveTpa.toFixed(1)}</td>
                    <td>${s.leaveBa.toFixed(1)}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            stockingStatsTable.innerHTML = html;
        }

        // Delegate chart rendering to charts.js
        const canvas = document.getElementById('stockingChartCanvas');
        if (!canvas) return;
        if (stockingChartInstance) { try { stockingChartInstance.destroy(); } catch(e) {} stockingChartInstance = null; }
        stockingChartInstance = buildStockingChart(areaStats, canvas);
    }

    function renderTallyTab() {
        if (!document.getElementById('tab-tally')?.classList.contains('active')) return;
        const selectedArea = tallyAreaSelect?.value || 'ALL';
        const subset = selectedArea === 'ALL'
            ? collectedData
            : collectedData.filter(e => e.areaLetter === selectedArea);

        // Update area dropdown
        updateTallyAreaDropdown();

        // Summary cards
        if (tallySummaryCards) {
            if (subset.length === 0) {
                tallySummaryCards.innerHTML = '<p class="placeholder-msg" style="padding:10px 12px; margin:0;">No data for selected area.</p>';
            } else {
                const report = calculateForestryReport(subset, currentBaf, currentLogRule, currentFormClass);
                const s = report.summary;
                tallySummaryCards.innerHTML = `
                    <div class="stat-card">
                        <span class="stat-value">${s.totalTreesPerAcre != null ? s.totalTreesPerAcre.toFixed(1) : '—'}</span>
                        <span class="stat-label">Trees/Acre</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${s.totalBaPerAcre != null ? s.totalBaPerAcre.toFixed(1) : '—'}</span>
                        <span class="stat-label">BA/Acre (sq ft)</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${s.avgTractDbh != null ? s.avgTractDbh.toFixed(1) + '"' : '—'}</span>
                        <span class="stat-label">Avg DBH (QMD)</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${s.totalVolPerAcre != null ? Math.round(s.totalVolPerAcre) : '—'}</span>
                        <span class="stat-label">Vol/Acre (BF)</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${s.numberOfPlots != null ? s.numberOfPlots : '—'}</span>
                        <span class="stat-label">Plots</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${subset.length}</span>
                        <span class="stat-label">Tree Entries</span>
                    </div>`;
            }
        }

        // Tally breakdown
        if (tallyResults) {
            if (subset.length === 0) {
                tallyResults.innerHTML = '<p class="placeholder-msg">No entries for this area.</p>';
            } else {
                displayTallyResults(generateTallyData(subset));
            }
        }

        // In-app charts — charts.js manages instances
        tallyChartInstances.forEach(c => { try { c.destroy(); } catch(e) {} });
        tallyChartInstances = renderTallyCharts(subset, currentBaf, currentLogRule, currentFormClass, tallyChartsContainer);
    }

    function updateTallyAreaDropdown() {
        if (!tallyAreaSelect) return;
        const cur = tallyAreaSelect.value;
        const areas = [...new Set(collectedData.map(e => e.areaLetter).filter(Boolean))].sort();
        tallyAreaSelect.innerHTML = '<option value="ALL">All Areas</option>';
        areas.forEach(a => {
            const o = document.createElement('option');
            o.value = o.textContent = a;
            tallyAreaSelect.appendChild(o);
        });
        if (areas.includes(cur)) tallyAreaSelect.value = cur;
        else tallyAreaSelect.value = 'ALL';
    }

    // ============================================================
    // CSV PARSING
    // ============================================================
    function parseCsvAndLoadData(csvContent) {
        const lines = csvContent.split(/\r?\n/);
        let headerIndex = -1, headers = [];
        for (let i = 0; i < lines.length; i++) {
            const norm = lines[i].trim().toLowerCase().split(',').map(h => h.trim().replace(/\s/g,''));
            if (norm.includes('plotnumber') && norm.includes('dbh') && norm.includes('species') && norm.includes('logs') && norm.includes('cut')) {
                headerIndex = i;
                headers = lines[i].trim().split(',').map(h => h.trim().toLowerCase());
                break;
            }
        }
        if (headerIndex === -1) throw new Error("CSV header not found. Requires: PlotNumber, DBH, Species, Logs, Cut");
        const idx = {
            p: headers.indexOf('plotnumber'), d: headers.indexOf('dbh'), sp: headers.indexOf('species'),
            l: headers.indexOf('logs'), c: headers.indexOf('cut'), n: headers.indexOf('notes'),
            lat: headers.indexOf('latitude'), lon: headers.indexOf('longitude'), ugs: headers.indexOf('ugs')
        };
        const parsedData = [];
        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('---') || line.startsWith(',')) continue;
            const values = []; let cur = '', inQ = false;
            for (let j = 0; j < line.length; j++) {
                const c = line[j], nc = line[j+1];
                if (c==='"' && inQ && nc==='"') { cur+='"'; j++; }
                else if (c==='"') { inQ=!inQ; }
                else if (c===',' && !inQ) { values.push(cur.trim()); cur=''; }
                else cur += c;
            }
            values.push(cur.trim());
            if (values.length <= Math.max(idx.p,idx.d,idx.sp,idx.l,idx.c)) continue;
            try {
                const plotNum = parseInt(values[idx.p], 10);
                if (isNaN(plotNum)) continue;
                const cutStr = (values[idx.c] || 'No').trim();
                const ugsStr = (idx.ugs > -1 && values[idx.ugs]) ? values[idx.ugs].trim() : 'No';
                const lat = idx.lat > -1 ? parseFloat(values[idx.lat]) : null;
                const lon = idx.lon > -1 ? parseFloat(values[idx.lon]) : null;
                parsedData.push({
                    id: Date.now() + i, plotNumber: plotNum, dbh: values[idx.d], species: values[idx.sp],
                    logs: values[idx.l], cutStatus: cutStr.toLowerCase()==='yes'?'Yes':'No',
                    ugsStatus: ugsStr.toLowerCase()==='yes'?'Yes':'No',
                    notes: idx.n > -1 ? (values[idx.n]||'') : '',
                    location: (lat!==null && lon!==null && !isNaN(lat) && !isNaN(lon)) ? {lat,lon} : null
                });
            } catch(e) { continue; }
        }
        return parsedData;
    }

    // ============================================================
    // CSV FORMAT FOR EXPORT

    // ============================================================
    // CSV EXPORT
    // ============================================================
    async function generateAndDownloadCsv() {
        if (!collectedData.length) { showFeedback("No data to save.", true); return; }
        const selBaf = currentBaf, selRule = currentLogRule, selFc = currentFormClass;
        const graphsEnabled = currentGenerateGraphs === 'Yes';
        const zipMode       = currentZipExport === 'Yes';
        showFeedback(zipMode ? "Building ZIP..." : "Generating CSV(s)...", false, 10000);

        let zip = null;
        if (zipMode) {
            if (typeof JSZip === 'undefined') {
                showFeedback("JSZip not loaded. Check internet connection.", true, 5000);
                return;
            }
            zip = new JSZip();
        }

        function triggerDownload(url, filename) {
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            a.style.visibility = 'hidden';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }

        async function handleTextFile(content, filename) {
            if (zipMode) {
                zip.file(filename, content);
            } else {
                const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                triggerDownload(url, filename);
                URL.revokeObjectURL(url);
                await new Promise(r => setTimeout(r, 250));
            }
        }

        async function handleTxtFile(content, filename) {
            if (zipMode) {
                zip.file(filename, content);
            } else {
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                triggerDownload(url, filename);
                URL.revokeObjectURL(url);
            }
        }

        async function handleChartPng(genFn, reportDataArg, filename) {
            const c = document.createElement('canvas'); c.width=800; c.height=450;
            const inst = genFn(reportDataArg, c);
            if (!inst) return;
            await new Promise(r => setTimeout(r, 250));
            try {
                const dataUrl = c.toDataURL('image/png');
                if (zipMode) {
                    zip.file(filename, dataUrl.split(',')[1], { base64: true });
                } else {
                    triggerDownload(dataUrl, filename);
                    await new Promise(r => setTimeout(r, 250));
                }
            } catch(e) {}
            try { inst.destroy(); } catch(e) {}
        }

        async function handleCanvasPng(canvas, filename) {
            if (!canvas) return;
            await new Promise(r => setTimeout(r, 100));
            try {
                const dataUrl = canvas.toDataURL('image/png');
                if (zipMode) {
                    zip.file(filename, dataUrl.split(',')[1], { base64: true });
                } else {
                    triggerDownload(dataUrl, filename);
                    await new Promise(r => setTimeout(r, 250));
                }
            } catch(e) { console.error('Canvas PNG error:', e); }
        }

        try {
            const grouped = collectedData.reduce((acc, e) => {
                const area = e.areaLetter || 'Unknown';
                if (!acc[area]) acc[area] = [];
                acc[area].push(e); return acc;
            }, {});
            const sortedAreas = Object.keys(grouped).sort();
            if (!sortedAreas.length) { showFeedback("No areas found.", true); return; }
            const ts = new Date().toISOString().slice(0,19).replace(/[-T:]/g,"");
            const projBase = projectNameInput?.value.trim().replace(/[^a-z0-9_\-]/gi,'_') || 'TimberTally';

            for (const [i, areaLetter] of sortedAreas.entries()) {
                const areaData = grouped[areaLetter];
                showFeedback(`Generating Area ${areaLetter} (${i+1}/${sortedAreas.length})...`, false, 6000);
                let reportData = null, tallyData = null, plotStats = null;
                try { reportData = calculateForestryReport(areaData, selBaf, selRule, selFc); } catch(e) {}
                try { tallyData = generateTallyData(areaData); } catch(e) {}
                try { plotStats = calculatePlotStats(areaData, selBaf, selRule, selFc); } catch(e) {}

                const nameBase = `${projBase}_Area${areaLetter}_${ts}`;

                if (graphsEnabled && reportData?.summary?.numberOfPlots > 0) {
                    await handleChartPng(generateBaChartExport,          reportData, `${nameBase}_BA_Dist.png`);
                    await handleChartPng(generateTpaChartExport,         reportData, `${nameBase}_TPA_Dist.png`);
                    await handleChartPng(generateVolSpeciesChartExport,  reportData, `${nameBase}_Vol_Species.png`);
                    await handleChartPng(generateVolSawtimberChartExport,reportData, `${nameBase}_Vol_Sawtimber.png`);

                    try {
                        const allAreaStats = calculateStandStocking(collectedData, selBaf);
                        if (allAreaStats?.length) {
                            const gCanvas = document.createElement('canvas');
                            gCanvas.width = 1200; gCanvas.height = 700;
                            const gInst = buildStockingChartExport(allAreaStats, gCanvas);
                            if (gInst) {
                                await new Promise(r => setTimeout(r, 300));
                                await handleCanvasPng(gCanvas, `${nameBase}_Gingrich_Stocking.png`);
                                try { gInst.destroy(); } catch(e) {}
                            }
                        }
                    } catch(e) { console.error('Gingrich export error:', e); }

                    try {
                        const projName = projectNameInput?.value.trim() || 'Untitled';
                        const summaryCanvas = buildSummaryReportCanvas(reportData, plotStats, areaLetter, projName, selRule, selFc, selBaf);
                        await handleCanvasPng(summaryCanvas, `${nameBase}_Summary_Report.png`);
                    } catch(e) { console.error('Summary report export error:', e); }
                }

                // Build CSV
                let raw = "PlotNumber,Area,DBH,Species,Logs,Cut,UGS,Notes,Latitude,Longitude\n";
                areaData.forEach(e => {
                    if (!e) return;
                    const notes = `"${(e.notes||'').replace(/"/g,'""')}"`;
                    const loc = e.location || {};
                    raw += `${e.plotNumber??'?'},${e.areaLetter??'?'},${e.dbh??'?'},"${e.species??'N/A'}",${e.logs??'?'},${e.cutStatus||'No'},${e.ugsStatus||'No'},${notes},${loc.lat||''},${loc.lon||''}\n`;
                });

                let tallyCsv = "\n\n--- TALLY DATA ---\nSpecies,DBH,Logs,Cut Status,Count\n";
                if (tallyData) {
                    Object.keys(tallyData).sort().forEach(sp => {
                        Object.keys(tallyData[sp]).sort((a,b)=>Number(a)-Number(b)).forEach(dbh => {
                            Object.keys(tallyData[sp][dbh]).sort((a,b)=>{if(a==='Cull')return 1;if(b==='Cull')return -1;return (parseFloat(a)||0)-(parseFloat(b)||0);}).forEach(logs => {
                                const c = tallyData[sp][dbh][logs];
                                if (c['Yes']>0) tallyCsv+=`"${sp}",${dbh},${logs},"Yes",${c['Yes']}\n`;
                                if (c['No']>0)  tallyCsv+=`"${sp}",${dbh},${logs},"No",${c['No']}\n`;
                            });
                        });
                    });
                }

                let plotCsv = `\n\n--- PER-PLOT VOLUME & STATS (Rule:${selRule}${selRule==='Doyle'?' FC'+selFc:''}, BAF:${selBaf}) ---\n`;
                if (plotStats?.numValidPlots > 0) {
                    plotCsv += "Plot,Volume (BF/Acre)\n";
                    const plotsInArea = {};
                    areaData.forEach(e => { if (e?.plotNumber) { const n=parseInt(e.plotNumber,10); if (!isNaN(n)) plotsInArea[n]=true; } });
                    const plotNsInArea = Object.keys(plotsInArea).map(Number).sort((a,b)=>a-b);
                    plotNsInArea.forEach((pn,idx) => { plotCsv += `${pn},${plotStats.plotVolumes?.[idx]??0}\n`; });
                    plotCsv += `\nNum Plots,${plotStats.numValidPlots}\nMean BF/Acre,${plotStats.meanV.toFixed(1)}\n`;
                    if (plotStats.numValidPlots > 1) {
                        plotCsv += `Variance,${(plotStats.stdDevV*plotStats.stdDevV).toFixed(1)}\nStd Dev,${plotStats.stdDevV.toFixed(1)}\nCV (%),${plotStats.cvV.toFixed(1)}\n`;
                    }
                } else plotCsv += "No plot data.\n";

                const reportCsv = reportData ? (() => { try { return formatReportForCsv(reportData); } catch(e) { return "\n--- FORESTRY REPORT DATA ---\nError formatting report.\n"; } })() : "\n--- FORESTRY REPORT DATA ---\nReport failed.\n";

                const ruleP = selRule.substring(0,4);
                const fcP = selRule==='Doyle' ? `FC${selFc}` : '';
                const csvFilename = `${projBase}_Area${areaLetter}_${ruleP}${fcP}_BAF${selBaf}_${ts}.csv`;
                await handleTextFile(raw + tallyCsv + plotCsv + reportCsv, csvFilename);
            }

            // Stand notes
            const notesText = getStandNotesText();
            if (notesText) {
                const header = `TimberTally Stand Notes\nProject: ${projectNameInput?.value.trim() || 'Untitled'}\nExported: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
                await handleTxtFile(header + notesText, `${projBase}_StandNotes_${ts}.txt`);
            }

            if (zipMode) {
                showFeedback("Compressing ZIP...", false, 8000);
                const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
                const zipUrl = URL.createObjectURL(zipBlob);
                triggerDownload(zipUrl, `${projBase}_${ts}.zip`);
                URL.revokeObjectURL(zipUrl);
                showFeedback(`ZIP saved: ${projBase}_${ts}.zip`, false, 4000);
            } else {
                const graphMsg = graphsEnabled ? ' & Graphs' : '';
                showFeedback(`CSV${graphMsg} saved for Area${sortedAreas.length>1?'s':''}: ${sortedAreas.join(', ')}`, false, 4000);
            }
        } catch(err) {
            console.error('Export error:', err);
            showFeedback(`Save Error: ${err.message||'Unknown'}`, true, 6000);
        }
    }
    // ============================================================
    // EVENT HANDLERS
    // ============================================================
    function handleSubmitEntry() {
        try {
            if (!dbhSelect || !speciesSelect || !logsSelect || !cutCheckbox) return;
            checkAndSetLogsForDbh();
            const currentLetter = areaLetters[currentAreaIndex];
            const newEntry = {
                id: Date.now(),
                plotNumber: currentPlotNumber, areaLetter: currentLetter,
                dbh: dbhSelect.value, species: speciesSelect.value,
                logs: logsSelect.value,
                cutStatus: cutCheckbox.checked ? 'Yes' : 'No',
                ugsStatus: ugsCheckbox?.checked ? 'Yes' : 'No',
                notes: notesTextarea?.value.trim() || '',
                location: currentLocation
            };
            if (!newEntry.species || !newEntry.dbh || !newEntry.logs) {
                showFeedback("Species, DBH, and Logs are required.", true); return;
            }
            collectedData.push(newEntry);
            renderEntries();
            saveSessionData();
            showFeedback(`✔ Entry added — Plot ${currentPlotNumber}, Area ${currentLetter}`);
            if (cutCheckbox) cutCheckbox.checked = false;
            if (ugsCheckbox) ugsCheckbox.checked = false;
            if (notesTextarea) notesTextarea.value = '';
            currentLocation = null;
            if (locationStatus) { locationStatus.textContent = 'Location not set'; locationStatus.style.color = ''; }
        } catch(e) {
            console.error('Submit error:', e);
            showFeedback(`Submit Error: ${e.message}`, true, 5000);
        }
    }

    function handleGetLocation() {
        if (!locationStatus) return;
        if (!('geolocation' in navigator)) { locationStatus.textContent = 'Not supported'; return; }
        locationStatus.textContent = 'Fetching...';
        if (getLocationBtn) getLocationBtn.disabled = true;
        navigator.geolocation.getCurrentPosition(
            pos => {
                currentLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                const acc = pos.coords.accuracy ? ` ±${Math.round(pos.coords.accuracy)}m` : '';
                locationStatus.textContent = `(${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)})${acc}`;
                locationStatus.style.color = 'green';
                if (getLocationBtn) getLocationBtn.disabled = false;
            },
            err => {
                currentLocation = null;
                const msgs = {1:'Denied',2:'Unavailable',3:'Timeout'};
                locationStatus.textContent = `Error: ${msgs[err.code]||'Unknown'}`;
                locationStatus.style.color = 'red';
                if (getLocationBtn) getLocationBtn.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    }

    function handleDeleteSelected() {
        if (!entriesTableBody) return;
        const checks = entriesTableBody.querySelectorAll('input[type="checkbox"]:checked');
        if (!checks.length) { showFeedback("No entries selected.", true); return; }
        const ids = new Set(Array.from(checks).map(cb => parseInt(cb.getAttribute('data-id'),10)).filter(id => !isNaN(id)));
        if (!confirm(`Delete ${ids.size} selected ${ids.size===1?'entry':'entries'}?`)) return;
        collectedData = collectedData.filter(e => !(e?.id && ids.has(e.id)));
        renderEntries(); saveSessionData();
        showFeedback(`${ids.size} ${ids.size===1?'entry':'entries'} deleted.`);
    }

    function handleDeleteAll() {
        if (!collectedData.length) { showFeedback("No data to delete.", true); return; }
        if (!confirm('WARNING: Delete ALL collected data? This cannot be undone.')) return;
        collectedData = [];
        try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
        currentAreaIndex = 0; currentPlotNumber = 1;
        renderEntries();
        showFeedback('All data deleted.');
        currentLocation = null;
        if (locationStatus) locationStatus.textContent = 'Location not set';
        if (projectNameInput) projectNameInput.value = '';
        if (autosaveStatus) autosaveStatus.textContent = '';
    }

    // ============================================================
    // TAB SWITCHING
    // ============================================================
    function switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
            btn.setAttribute('aria-selected', String(btn.dataset.tab === tabId));
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            const isActive = panel.id === `tab-${tabId}`;
            panel.classList.toggle('active', isActive);
            panel.hidden = !isActive;
        });
        if (tabId === 'tally') renderTallyTab();
    }

    // ============================================================
    // COMPASS
    // ============================================================
    let orientationHandler = null;
    const handleOrientation = (event) => {
        let h = null, s = '---';
        try {
            if (event.absolute===true && event.alpha!==null) { h=360-event.alpha; s='True (abs)'; }
            else if (event.webkitCompassHeading!=null) { h=event.webkitCompassHeading; s='Mag (webkit)'; }
            else if (event.alpha!==null) { h=360-event.alpha; s='Mag (alpha)'; }
            if (h !== null) {
                h = (h+360) % 360;
                if (compassNeedle) compassNeedle.style.transform = `translateX(-50%) rotate(${h}deg)`;
                if (compassHeading) compassHeading.textContent = `${h.toFixed(0)}°`;
                if (compassSource) compassSource.textContent = ` (${s})`;
            }
        } catch(e) {}
    };

    function startCompass() {
        if (!compassContainer) return;
        compassContainer.style.display = 'flex';
        if (compassHeading) compassHeading.textContent = '---°';
        if (compassSource) compassSource.textContent = ' (Initializing...)';
        orientationHandler = handleOrientation;
        if ('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', orientationHandler, true);
        else if ('ondeviceorientation' in window) window.addEventListener('deviceorientation', orientationHandler, true);
        else { if (compassHeading) compassHeading.textContent = 'N/A'; if (compassSource) compassSource.textContent = ' (Unsupported)'; }
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================
    if (submitBtn)     submitBtn.addEventListener('click', handleSubmitEntry);
    if (getLocationBtn) getLocationBtn.addEventListener('click', handleGetLocation);
    if (saveCsvBtn)    saveCsvBtn.addEventListener('click', generateAndDownloadCsv);
    if (deleteBtn)     deleteBtn.addEventListener('click', handleDeleteSelected);
    if (deleteAllBtn)  deleteAllBtn.addEventListener('click', handleDeleteAll);

    if (entriesTableBody) {
        entriesTableBody.addEventListener('change', e => {
            if (e.target.type === 'checkbox' && deleteBtn) deleteBtn.disabled = !isAnyCheckboxChecked();
        });
    }

    // DBH stepper buttons
    if (dbhDecBtn) dbhDecBtn.addEventListener('click', () => setDbhValue(parseInt(dbhSelect?.value || '10', 10) - DBH_STEP));
    if (dbhIncBtn) dbhIncBtn.addEventListener('click', () => setDbhValue(parseInt(dbhSelect?.value || '10', 10) + DBH_STEP));


    if (plotDecrementBtn) plotDecrementBtn.addEventListener('click', () => {
        if (currentPlotNumber > MIN_PLOT_NUMBER) { currentPlotNumber--; updatePlotDisplay(); saveSessionData(); }
    });
    if (plotIncrementBtn) plotIncrementBtn.addEventListener('click', () => {
        if (currentPlotNumber < MAX_PLOT_NUMBER) { currentPlotNumber++; updatePlotDisplay(); saveSessionData(); }
    });
    if (areaDecrementBtn) areaDecrementBtn.addEventListener('click', () => {
        if (currentAreaIndex > 0) { currentAreaIndex--; updateAreaDisplay(); calculateAndDisplayNeededPlots(); saveSessionData(); }
    });
    if (areaIncrementBtn) areaIncrementBtn.addEventListener('click', () => {
        if (currentAreaIndex < areaLetters.length-1) { currentAreaIndex++; updateAreaDisplay(); calculateAndDisplayNeededPlots(); saveSessionData(); }
    });

    if (toggleSettingsBtn) {
        toggleSettingsBtn.addEventListener('click', () => {
            if (!settingsSection) return;
            const isHidden = settingsSection.hidden;
            settingsSection.hidden = !isHidden;
            toggleSettingsBtn.setAttribute('aria-expanded', String(isHidden));
            toggleSettingsBtn.innerHTML = isHidden ? '&#10005; Settings' : '&#9881; Settings';
        });
    }

    if (bafSelect) bafSelect.addEventListener('change', e => { currentBaf = parseInt(e.target.value,10); saveSettings(); showSettingsFeedback(`BAF = ${currentBaf}`); calculateAndDisplayNeededPlots(); });
    if (logRuleSelect) logRuleSelect.addEventListener('change', e => { currentLogRule = e.target.value; saveSettings(); showSettingsFeedback(`Rule: ${currentLogRule}`); checkAndSetLogsForDbh(); calculateAndDisplayNeededPlots(); updateFormClassVisibility(); });
    if (formClassSelect) formClassSelect.addEventListener('change', e => { currentFormClass = parseInt(e.target.value,10); saveSettings(); showSettingsFeedback(`Doyle FC: ${currentFormClass}`); calculateAndDisplayNeededPlots(); });
    if (generateGraphsSelect) generateGraphsSelect.addEventListener('change', e => { currentGenerateGraphs = e.target.value; saveSettings(); showSettingsFeedback(`Graphs: ${currentGenerateGraphs}`); updateSaveBtnLabel(); });

    // Dark mode
    if (darkModeSelect) darkModeSelect.addEventListener('change', e => {
        currentDarkMode = e.target.value;
        saveSettings();
        applyDarkMode();
        showSettingsFeedback(`Dark mode: ${currentDarkMode}`);
    });
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (currentDarkMode === 'system') applyDarkMode();
    });

    // Manual update check
    if (manualUpdateCheckBtn && 'serviceWorker' in navigator) {
        manualUpdateCheckBtn.addEventListener('click', () => {
            if (updateStatusTimeout) clearTimeout(updateStatusTimeout);
            if (updateCheckStatus) updateCheckStatus.textContent = 'Checking...';
            manualUpdateCheckBtn.disabled = true;
            navigator.serviceWorker.ready
                .then(r => r.update())
                .then(reg => {
                    if (!reg) { if (updateCheckStatus) updateCheckStatus.textContent = 'Check failed.'; return; }
                    if (reg.installing) { if (updateCheckStatus) updateCheckStatus.textContent = 'Update installing...'; }
                    else if (reg.waiting) { if (updateCheckStatus) updateCheckStatus.textContent = 'Update ready!'; }
                    else { if (updateCheckStatus) updateCheckStatus.textContent = 'Up to date.'; }
                    updateStatusTimeout = setTimeout(() => { if (updateCheckStatus) updateCheckStatus.textContent = ''; }, 3000);
                })
                .catch(() => { if (updateCheckStatus) updateCheckStatus.textContent = 'Check failed.'; })
                .finally(() => { if (manualUpdateCheckBtn) manualUpdateCheckBtn.disabled = false; });
        });
    }

    if (showInfoBtn) showInfoBtn.addEventListener('click', () => window.open('./README.md', '_blank', 'noopener'));
    if (zipExportSelect) zipExportSelect.addEventListener('change', e => { currentZipExport = e.target.value; saveSettings(); showSettingsFeedback(`ZIP export: ${currentZipExport}`); updateSaveBtnLabel(); });

    // Species management
    if (addSpeciesBtn) addSpeciesBtn.addEventListener('click', () => {
        if (!newSpeciesInput) return;
        const name = newSpeciesInput.value.trim();
        if (!name) { showSpeciesFeedback("Enter a species name.", true); return; }
        if (currentSpeciesList.some(s => s.toLowerCase() === name.toLowerCase())) { showSpeciesFeedback(`"${name}" already exists.`, true); return; }
        currentSpeciesList.push(name);
        populateSpeciesDropdowns(); saveSpeciesList(); newSpeciesInput.value = '';
        showSpeciesFeedback(`"${name}" added.`);
    });

    if (removeSpeciesBtn) removeSpeciesBtn.addEventListener('click', () => {
        if (!removeSpeciesSelect) return;
        const toRemove = Array.from(removeSpeciesSelect.selectedOptions).map(o => o.value);
        if (!toRemove.length) { showSpeciesFeedback("Select species to remove.", true); return; }
        if (!confirm(`Remove: ${toRemove.join(', ')}?`)) return;
        currentSpeciesList = currentSpeciesList.filter(s => !toRemove.includes(s));
        populateSpeciesDropdowns(); saveSpeciesList();
        showSpeciesFeedback(`Removed: ${toRemove.join(', ')}.`);
    });

    // Project management
    if (saveProjectBtn) saveProjectBtn.addEventListener('click', () => {
        const name = projectNameInput?.value.trim();
        if (!name) { showProjectFeedback("Enter a project name.", true); return; }
        if (savedProjects[name] && !confirm(`Overwrite project "${name}"?`)) return;
        try {
            savedProjects[name] = JSON.parse(JSON.stringify(collectedData));
            saveProjectsToStorage(); populateLoadProjectDropdown();
            showProjectFeedback(`Project "${name}" saved.`);
        } catch(e) { showProjectFeedback(`Save error: ${e.message}`, true); }
    });

    if (loadProjectBtn) loadProjectBtn.addEventListener('click', () => {
        const name = loadProjectSelect?.value;
        if (!name) { showProjectFeedback("Select a project.", true); return; }
        if (!savedProjects[name]) { showProjectFeedback(`Project "${name}" not found.`, true); return; }
        if (collectedData.length > 0 && !confirm(`Load "${name}"? This replaces current unsaved data.`)) return;
        try {
            collectedData = JSON.parse(JSON.stringify(savedProjects[name]));
            if (projectNameInput) projectNameInput.value = name;
            renderEntries(); saveSessionData();
            showProjectFeedback(`Project "${name}" loaded.`);
            currentLocation = null;
            if (locationStatus) locationStatus.textContent = 'Location not set';
        } catch(e) { showProjectFeedback(`Load error: ${e.message}`, true); }
    });

    if (deleteProjectBtn) deleteProjectBtn.addEventListener('click', () => {
        const name = loadProjectSelect?.value;
        if (!name) { showProjectFeedback("Select a project.", true); return; }
        if (!savedProjects[name]) { showProjectFeedback(`Project not found.`, true); return; }
        if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
        delete savedProjects[name];
        saveProjectsToStorage(); populateLoadProjectDropdown();
        if (projectNameInput?.value === name) projectNameInput.value = '';
        showProjectFeedback(`Project "${name}" deleted.`);
    });

    // ============================================================
    // CSV FILE LOADER — shared by button and drag-and-drop
    // ============================================================
    function loadCsvFile(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showProjectFeedback("Must be a .csv file.", true);
            if (csvFileInput) csvFileInput.value = null;
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const parsed = parseCsvAndLoadData(e.target.result);
                if (!parsed.length) { showProjectFeedback("No valid data found in CSV.", true); if (csvFileInput) csvFileInput.value=null; return; }
                let chosenArea = null;
                do {
                    chosenArea = prompt(`Enter Area Letter (A-Z) for all ${parsed.length} entries from "${file.name}":`, areaLetters[currentAreaIndex]);
                    if (chosenArea === null) { showProjectFeedback("CSV load cancelled.", false); if (csvFileInput) csvFileInput.value=null; return; }
                    chosenArea = chosenArea.trim().toUpperCase();
                } while (!(chosenArea.length===1 && areaLetters.includes(chosenArea)) && (alert("Enter a single letter A-Z.") || true));

                const existing = collectedData.filter(e => e.areaLetter === chosenArea);
                const maxPlot = existing.reduce((max, e) => Math.max(max, parseInt(e.plotNumber,10)||0), 0);
                let nextPlot = maxPlot + 1;
                const origPlots = [...new Set(parsed.map(e => parseInt(e.plotNumber,10)).filter(n => !isNaN(n)))].sort((a,b)=>a-b);
                const plotMap = {};
                origPlots.forEach(op => {
                    if (maxPlot > 0) { plotMap[op] = Math.min(nextPlot++, MAX_PLOT_NUMBER); }
                    else plotMap[op] = op;
                });
                parsed.forEach(e => {
                    const op = parseInt(e.plotNumber,10);
                    if (!isNaN(op) && plotMap[op] !== undefined) e.plotNumber = plotMap[op];
                    e.areaLetter = chosenArea;
                });
                collectedData = collectedData.concat(parsed);
                renderEntries(); saveSessionData();
                showProjectFeedback(`Added ${parsed.length} entries to Area ${chosenArea}.${maxPlot>0?' Plots renumbered.':''}`, false, 4000);
                currentLocation = null;
                if (locationStatus) locationStatus.textContent = 'Location not set';
                if (csvFileInput) csvFileInput.value = null;
            } catch(err) {
                showProjectFeedback(`CSV Error: ${err.message}`, true, 5000);
                if (csvFileInput) csvFileInput.value = null;
            }
        };
        reader.onerror = () => { showProjectFeedback("File read error.", true); if (csvFileInput) csvFileInput.value=null; };
        reader.readAsText(file);
    }

    if (loadCsvBtn) loadCsvBtn.addEventListener('click', () => {
        const file = csvFileInput?.files[0];
        if (!file) { showProjectFeedback("Select a CSV file.", true); return; }
        loadCsvFile(file);
    });

    // ---- Drag-and-drop CSV zone ----
    const csvDropZone = document.getElementById('csvDropZone');
    if (csvDropZone) {
        csvDropZone.addEventListener('dragover', e => {
            e.preventDefault();
            csvDropZone.classList.add('drag-over');
        });
        csvDropZone.addEventListener('dragleave', e => {
            if (!csvDropZone.contains(e.relatedTarget)) csvDropZone.classList.remove('drag-over');
        });
        csvDropZone.addEventListener('drop', e => {
            e.preventDefault();
            csvDropZone.classList.remove('drag-over');
            const file = e.dataTransfer?.files[0];
            if (!file) return;
            if (!file.name.toLowerCase().endsWith('.csv')) {
                showProjectFeedback("Must be a .csv file.", true);
                return;
            }
            loadCsvFile(file);
        });
        // Also allow tapping the drop zone on mobile to trigger file picker
        csvDropZone.addEventListener('click', () => csvFileInput?.click());
    }

    // Tally area selector
    if (tallyAreaSelect) tallyAreaSelect.addEventListener('change', renderTallyTab);

    // Stocking chart
    if (calculateStockingBtn) calculateStockingBtn.addEventListener('click', renderStockingChart);

    // Compass
    if (showCompassBtn) {
        showCompassBtn.addEventListener('click', () => {
            if (typeof DeviceOrientationEvent !== 'undefined') {
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    DeviceOrientationEvent.requestPermission()
                        .then(p => { if (p==='granted') startCompass(); else alert("Permission required for compass."); })
                        .catch(e => alert("Permission error: " + e.message));
                } else startCompass();
            } else alert("Compass not supported by this browser.");
        });
    }

    if (closeCompassBtn) {
        closeCompassBtn.addEventListener('click', () => {
            if (compassContainer) compassContainer.style.display = 'none';
            if (orientationHandler) {
                window.removeEventListener('deviceorientationabsolute', orientationHandler, true);
                window.removeEventListener('deviceorientation', orientationHandler, true);
                orientationHandler = null;
            }
        });
    }

    // Tree Key Modal
    if (showTreeKeyBtn && treeKeyModal) showTreeKeyBtn.addEventListener('click', () => treeKeyModal.style.display = 'flex');
    const closeKeyModal = () => { if (treeKeyModal) treeKeyModal.style.display = 'none'; };
    if (closeTreeKeyBtn)       closeTreeKeyBtn.addEventListener('click', closeKeyModal);
    if (closeTreeKeyBtnBottom) closeTreeKeyBtnBottom.addEventListener('click', closeKeyModal);
    if (treeKeyModal) treeKeyModal.addEventListener('click', e => { if (e.target === treeKeyModal) closeKeyModal(); });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // ============================================================
    // ============================================================
    // NOTES TAB
    // ============================================================
    let notesSaveTimeout = null;

    function loadStandNotes() {
        try {
            const saved = localStorage.getItem(NOTES_STORAGE_KEY) || '';
            if (standNotesTextarea) standNotesTextarea.value = saved;
        } catch(e) {}
    }

    function saveStandNotes() {
        try {
            localStorage.setItem(NOTES_STORAGE_KEY, standNotesTextarea?.value || '');
            if (notesSavedStatus) {
                notesSavedStatus.textContent = '✓ Saved';
                clearTimeout(notesSaveTimeout);
                notesSaveTimeout = setTimeout(() => { if (notesSavedStatus) notesSavedStatus.textContent = ''; }, 2000);
            }
        } catch(e) {}
    }

    function getStandNotesText() {
        return standNotesTextarea?.value?.trim() || '';
    }

    if (standNotesTextarea) {
        standNotesTextarea.addEventListener('input', () => {
            clearTimeout(notesSaveTimeout);
            notesSaveTimeout = setTimeout(saveStandNotes, 600);
            if (notesSavedStatus) notesSavedStatus.textContent = '';
        });
    }

    if (clearNotesBtn) {
        clearNotesBtn.addEventListener('click', () => {
            if (!standNotesTextarea?.value?.trim()) return;
            if (confirm('Clear all stand notes? This cannot be undone.')) {
                standNotesTextarea.value = '';
                saveStandNotes();
            }
        });
    }

    // ============================================================
    // INSTALL PROMPT (PWA)
    // ============================================================
    function showInstallUI(show) {
        if (installBanner) installBanner.style.display = show ? 'flex' : 'none';
        if (installAppBtn) installAppBtn.style.display = show ? 'inline-flex' : 'none';
    }

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredInstallPrompt = e;
        // Only show banner if not dismissed this session
        if (!sessionStorage.getItem('installDismissed')) showInstallUI(true);
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        showInstallUI(false);
    });

    async function triggerInstall() {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') deferredInstallPrompt = null;
        showInstallUI(false);
    }

    if (installAcceptBtn) installAcceptBtn.addEventListener('click', triggerInstall);
    if (installAppBtn)    installAppBtn.addEventListener('click', triggerInstall);
    if (installDismissBtn) installDismissBtn.addEventListener('click', () => {
        showInstallUI(false);
        sessionStorage.setItem('installDismissed', '1');
    });

    // ============================================================
    // INITIALIZATION
    // ============================================================
    function initializeApp() {
        console.log("TimberTally v7 initializing...");
        try {
            const updateEl = document.getElementById('updateNotification');
            if (updateEl) updateEl.style.display = 'none';
            loadSettings();
            updateFormClassVisibility();
            initializeSpeciesManagement();
            initializeProjectManagement();
            populateDbhOptions();
            populateLogsOptions();
            checkAndSetLogsForDbh();
            loadStandNotes();
            loadAndPromptSessionData();
            updateSaveBtnLabel();
            console.log("TimberTally v7 initialized.");
        } catch(err) {
            console.error("INIT ERROR:", err);
            if (document.body) {
                document.body.innerHTML = `<div style="padding:20px;color:red;"><h2>App Init Failed</h2><p>${err.message}</p>Check console.</div>`;
            }
        }
    }

    initializeApp();

}); // end DOMContentLoaded

// --- END OF script.js ---
