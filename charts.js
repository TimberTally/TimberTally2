// =============================================================================
// charts.js — Chart.js generators for TimberTally
// Depends on: forestry-data.js (GINGRICH_A, GINGRICH_B)
//             forestry-calc.js (calculateForestryReport, calculateStandStocking)
// All functions are called from script.js; chart instances are managed there.
// =============================================================================

// --- Shared color palette ---
const CHART_COLORS = {
    leave: 'rgba(61,107,32,0.65)', leaveBorder: 'rgba(61,107,32,1)',
    cut:   'rgba(200,35,51,0.65)', cutBorder:   'rgba(200,35,51,1)',
    blue:  'rgba(13,110,253,0.65)', blueBorder:  'rgba(13,110,253,1)'
};

const AREA_COLORS = ['#e8920a','#2196F3','#9C27B0','#009688','#FF5722','#607D8B','#795548','#E91E63'];

// DBH class label mapping (long key → short display label)
const DBH_CLASS_MAP = {
    'Sapling':        'Sapling',
    'Poletimber':     'Poletimber',
    'Small Sawtimber':'S Saw',
    'Medium Sawtimber':'M Saw',
    'Large Sawtimber': 'L Saw',
    'Other':          'Other'
};
const DBH_CLASS_LABELS = ['Sapling','Poletimber','S Saw','M Saw','L Saw','Other'];

// --- Shared chart options builder ---
function buildChartOpts(title, xLabel, yLabel, stacked = false) {
    return {
        animation: false,
        plugins: {
            customCanvasBackgroundColor: { color: 'white' },
            title: { display: true, text: title, font: { size: 14, weight: 'bold' }, color: '#1e2d0f' },
            legend: { labels: { font: { size: 11 } } },
            tooltip: { mode: 'index' }
        },
        responsive: true, maintainAspectRatio: true,
        scales: {
            x: { stacked, title: { display: true, text: xLabel, font: { size: 11 }, color: '#3d4d2e' } },
            y: { stacked, title: { display: true, text: yLabel, font: { size: 11 }, color: '#3d4d2e' }, beginAtZero: true }
        }
    };
}

// Shared export options builder (fixed-size, print-quality)
function buildExportOpts(title, xLabel, yLabel, stacked = false, horizontal = false) {
    const opts = {
        animation: false,
        plugins: {
            customCanvasBackgroundColor: { color: 'white' },
            title: { display: true, text: title, font: { size: 18, weight: 'bold' }, color: '#000000' },
            tooltip: { mode: 'index' }
        },
        responsive: false, maintainAspectRatio: false,
        scales: {
            x: { stacked, title: { display: true, text: horizontal ? yLabel : xLabel, font: { size: 14, weight: 'bold' }, color: '#000000' } },
            y: { stacked, title: { display: true, text: horizontal ? xLabel : yLabel, font: { size: 14, weight: 'bold' }, color: '#000000' }, beginAtZero: true }
        }
    };
    if (horizontal) opts.indexAxis = 'y';
    return opts;
}

// Helper: resolve short label → dist entry
function distByLabel(dist, shortLabel) {
    const key = Object.keys(DBH_CLASS_MAP).find(k => DBH_CLASS_MAP[k] === shortLabel);
    return key ? (dist[key] || {}) : {};
}

// =============================================================================
// IN-APP (RESPONSIVE) CHART GENERATORS — called from renderTallyCharts()
// =============================================================================

/**
 * Render the tally BA/TPA/Vol charts into tallyChartsContainer.
 * Manages its own instance array; returns array of Chart instances.
 * @param {Array}  subset            - Filtered entry data
 * @param {number} baf
 * @param {string} logRule
 * @param {number} formClass
 * @param {HTMLElement} container    - DOM element to append canvases into
 * @returns {Chart[]} instances for later .destroy()
 */
function renderTallyCharts(subset, baf, logRule, formClass, container) {
    container.innerHTML = '';
    const instances = [];

    if (!subset?.length) {
        container.innerHTML = '<p class="placeholder-msg">Add data to see charts.</p>';
        return instances;
    }

    const report = calculateForestryReport(subset, baf, logRule, formClass);
    if (!report?.summary?.numberOfPlots) {
        container.innerHTML = '<p class="placeholder-msg">Need at least 1 plot to generate charts.</p>';
        return instances;
    }

    const baCan  = document.createElement('canvas'); container.appendChild(baCan);
    const tpaCan = document.createElement('canvas'); container.appendChild(tpaCan);
    const volCan = document.createElement('canvas'); container.appendChild(volCan);

    const baChart  = generateBaChart(report, baCan);   if (baChart)  instances.push(baChart);
    const tpaChart = generateTpaChart(report, tpaCan);  if (tpaChart) instances.push(tpaChart);
    const volChart = generateVolSpeciesChart(report, volCan); if (volChart) instances.push(volChart);

    return instances;
}

function generateBaChart(report, canvas) {
    if (!canvas || !report?.standDistribution) return null;
    const dist = report.standDistribution;
    const leaveData = DBH_CLASS_LABELS.map(l => distByLabel(dist, l).baSqFtPerAcreLeave || 0);
    const cutData   = DBH_CLASS_LABELS.map(l => distByLabel(dist, l).baSqFtPerAcreCut   || 0);
    try {
        return new Chart(canvas, {
            type: 'bar',
            data: { labels: DBH_CLASS_LABELS, datasets: [
                { label: 'Leave BA/Acre', data: leaveData, backgroundColor: CHART_COLORS.leave, borderColor: CHART_COLORS.leaveBorder, borderWidth: 1 },
                { label: 'Cut BA/Acre',   data: cutData,   backgroundColor: CHART_COLORS.cut,   borderColor: CHART_COLORS.cutBorder,   borderWidth: 1 }
            ]},
            options: buildChartOpts('Basal Area Distribution (sq ft/Acre)', 'DBH Class', 'BA/Acre (sq ft)', true)
        });
    } catch(e) { return null; }
}

function generateTpaChart(report, canvas) {
    if (!canvas || !report?.standDistribution) return null;
    const dist = report.standDistribution;
    const leaveData = DBH_CLASS_LABELS.map(l => distByLabel(dist, l).tpaPerAcreLeave || 0);
    const cutData   = DBH_CLASS_LABELS.map(l => distByLabel(dist, l).tpaPerAcreCut   || 0);
    try {
        return new Chart(canvas, {
            type: 'bar',
            data: { labels: DBH_CLASS_LABELS, datasets: [
                { label: 'Leave TPA', data: leaveData, backgroundColor: CHART_COLORS.leave, borderColor: CHART_COLORS.leaveBorder, borderWidth: 1 },
                { label: 'Cut TPA',   data: cutData,   backgroundColor: CHART_COLORS.cut,   borderColor: CHART_COLORS.cutBorder,   borderWidth: 1 }
            ]},
            options: buildChartOpts('Trees Per Acre Distribution', 'DBH Class', 'Trees/Acre', true)
        });
    } catch(e) { return null; }
}

function generateVolSpeciesChart(report, canvas) {
    if (!canvas || !report?.speciesSummary2) return null;
    const sorted = Object.entries(report.speciesSummary2)
        .filter(([s, d]) => s !== 'TOTALS' && d?.totalSpeciesVolPerAcre > 0)
        .sort(([, a], [, b]) => b.totalSpeciesVolPerAcre - a.totalSpeciesVolPerAcre);
    if (!sorted.length) return null;
    const labels = sorted.map(([s]) => s);
    const data   = sorted.map(([, d]) => d.totalSpeciesVolPerAcre);
    try {
        return new Chart(canvas, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Vol/Acre (BF)', data, backgroundColor: CHART_COLORS.blue, borderColor: CHART_COLORS.blueBorder, borderWidth: 1 }]},
            options: {
                ...buildChartOpts('Volume by Species (BF/Acre)', 'Species', 'Board Feet/Acre'),
                indexAxis: 'y',
                plugins: {
                    ...buildChartOpts('Volume by Species (BF/Acre)', 'Species', 'Board Feet/Acre').plugins,
                    legend: { display: false }
                }
            }
        });
    } catch(e) { return null; }
}

// =============================================================================
// EXPORT-QUALITY (FIXED-SIZE) CHART GENERATORS — called from CSV export
// =============================================================================

function generateBaChartExport(report, canvas) {
    if (!canvas || !report?.standDistribution) return null;
    const dist = report.standDistribution;
    const leaveData = DBH_CLASS_LABELS.map(l => distByLabel(dist, l).baSqFtPerAcreLeave || 0);
    const cutData   = DBH_CLASS_LABELS.map(l => distByLabel(dist, l).baSqFtPerAcreCut   || 0);
    try {
        return new Chart(canvas, {
            type: 'bar',
            data: { labels: DBH_CLASS_LABELS, datasets: [
                { label: 'Leave BA/Acre', data: leaveData, backgroundColor: 'rgba(75,192,192,0.6)', borderColor: 'rgba(75,192,192,1)', borderWidth: 1 },
                { label: 'Cut BA/Acre',   data: cutData,   backgroundColor: 'rgba(255,99,132,0.6)', borderColor: 'rgba(255,99,132,1)', borderWidth: 1 }
            ]},
            options: buildExportOpts('Basal Area Distribution (SqFt/Acre)', 'BA / Acre (Sq Ft)', 'DBH Class', true)
        });
    } catch(e) { return null; }
}

function generateTpaChartExport(report, canvas) {
    if (!canvas || !report?.standDistribution) return null;
    const dist = report.standDistribution;
    const leaveData = DBH_CLASS_LABELS.map(l => distByLabel(dist, l).tpaPerAcreLeave || 0);
    const cutData   = DBH_CLASS_LABELS.map(l => distByLabel(dist, l).tpaPerAcreCut   || 0);
    try {
        return new Chart(canvas, {
            type: 'bar',
            data: { labels: DBH_CLASS_LABELS, datasets: [
                { label: 'Leave TPA', data: leaveData, backgroundColor: 'rgba(75,192,192,0.6)', borderColor: 'rgba(75,192,192,1)', borderWidth: 1 },
                { label: 'Cut TPA',   data: cutData,   backgroundColor: 'rgba(255,99,132,0.6)', borderColor: 'rgba(255,99,132,1)', borderWidth: 1 }
            ]},
            options: buildExportOpts('Trees Per Acre Distribution', 'Trees / Acre', 'DBH Class', true)
        });
    } catch(e) { return null; }
}

function generateVolSpeciesChartExport(report, canvas) {
    if (!canvas || !report?.speciesSummary2) return null;
    const sorted = Object.entries(report.speciesSummary2)
        .filter(([s, d]) => s !== 'TOTALS' && d?.totalSpeciesVolPerAcre > 0)
        .sort(([, a], [, b]) => b.totalSpeciesVolPerAcre - a.totalSpeciesVolPerAcre);
    const labels = sorted.map(([s]) => s);
    const data   = sorted.map(([, d]) => d.totalSpeciesVolPerAcre);
    try {
        return new Chart(canvas, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Total Vol/Acre', data, backgroundColor: 'rgba(54,162,235,0.6)', borderColor: 'rgba(54,162,235,1)', borderWidth: 1 }]},
            options: { ...buildExportOpts('Volume by Species (BF/Acre)', 'Board Feet / Acre', 'Species', false, true), plugins: { ...buildExportOpts().plugins, legend: { display: false } } }
        });
    } catch(e) { return null; }
}

function generateVolSawtimberChartExport(report, canvas) {
    if (!canvas || !report?.speciesSummary2) return null;
    const sorted = Object.entries(report.speciesSummary2)
        .filter(([s, d]) => s !== 'TOTALS' && d && (d.volSmallPerAcre > 0 || d.volMediumPerAcre > 0 || d.volLargePerAcre > 0))
        .map(([s, d]) => ({ species: s, small: d.volSmallPerAcre || 0, medium: d.volMediumPerAcre || 0, large: d.volLargePerAcre || 0, totalSaw: (d.volSmallPerAcre || 0) + (d.volMediumPerAcre || 0) + (d.volLargePerAcre || 0) }))
        .sort((a, b) => b.totalSaw - a.totalSaw);
    const labels = sorted.map(i => i.species);
    try {
        return new Chart(canvas, {
            type: 'bar',
            data: { labels, datasets: [
                { label: 'S Saw Vol/Acre (12-17.9")', data: sorted.map(i => i.small),  backgroundColor: 'rgba(255,206,86,0.6)',  borderColor: 'rgba(255,206,86,1)',  borderWidth: 1 },
                { label: 'M Saw Vol/Acre (18-23.9")', data: sorted.map(i => i.medium), backgroundColor: 'rgba(255,159,64,0.6)',  borderColor: 'rgba(255,159,64,1)',  borderWidth: 1 },
                { label: 'L Saw Vol/Acre (24"+)',      data: sorted.map(i => i.large),  backgroundColor: 'rgba(153,102,255,0.6)', borderColor: 'rgba(153,102,255,1)', borderWidth: 1 }
            ]},
            options: buildExportOpts('Sawtimber Volume Distribution by Species (BF/Acre)', 'Board Feet / Acre', 'Species', true)
        });
    } catch(e) { return null; }
}

// =============================================================================
// GINGRICH STOCKING CHART — called from renderStockingChart() in script.js
// =============================================================================

/**
 * Build and return a Gingrich stocking chart on the provided canvas.
 * Caller is responsible for destroying the previous instance.
 * @param {Array}       areaStats   - Output of calculateStandStocking()
 * @param {HTMLElement} canvas
 * @returns {Chart|null}
 */
function buildStockingChart(areaStats, canvas) {
    if (!areaStats?.length || !canvas) return null;

    const datasets = [];

    // Reference curves from forestry-data.js
    datasets.push({ label: 'A-Level (Full Stocking)', data: GINGRICH_A, borderColor: '#c82333', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, type: 'line', order: 0 });
    datasets.push({ label: 'B-Level (Min Stocking)',  data: GINGRICH_B, borderColor: '#e8920a', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 4], pointRadius: 0, type: 'line', order: 0 });

    // One scatter dataset per area (Total = circle, Cut = triangle, Leave = rect)
    areaStats.forEach((s, i) => {
        const color = AREA_COLORS[i % AREA_COLORS.length];
        const pts = [];
        if (s.totalQmd > 0 && s.totalTpa > 0) pts.push({ x: s.totalQmd, y: s.totalTpa, label: `${s.area} Total` });
        if (s.cutQmd   > 0 && s.cutTpa   > 0) pts.push({ x: s.cutQmd,   y: s.cutTpa,   label: `${s.area} Cut` });
        if (s.leaveQmd > 0 && s.leaveTpa > 0) pts.push({ x: s.leaveQmd, y: s.leaveTpa, label: `${s.area} Leave` });
        if (!pts.length) return;
        datasets.push({
            label: `Area ${s.area}`,
            data: pts,
            backgroundColor: [color, `${color}99`, `${color}55`].slice(0, pts.length),
            borderColor: color,
            pointStyle:  ['circle', 'triangle', 'rect'].slice(0, pts.length),
            pointRadius: 9, pointHoverRadius: 12,
            type: 'scatter', order: 1
        });
    });

    try {
        return new Chart(canvas, {
            type: 'scatter',
            data: { datasets },
            options: {
                animation: false, responsive: true, maintainAspectRatio: true,
                plugins: {
                    title: { display: true, text: 'Gingrich Stocking Chart — Upland Hardwoods', font: { size: 14, weight: 'bold' }, color: '#1e2d0f' },
                    tooltip: {
                        callbacks: {
                            label: ctx => {
                                const pt = ctx.raw;
                                return pt.label
                                    ? `${pt.label}: QMD=${pt.x.toFixed(1)}", TPA=${pt.y.toFixed(1)}`
                                    : `QMD: ${pt.x}", TPA: ${pt.y}`;
                            }
                        }
                    },
                    legend: { labels: { font: { size: 11 } } }
                },
                scales: {
                    x: { type: 'linear', min: 0, max: 30, title: { display: true, text: 'Average Stand DBH / QMD (inches)', font: { size: 12 } } },
                    y: { type: 'linear', min: 0, title: { display: true, text: 'Trees Per Acre (TPA)', font: { size: 12 } } }
                }
            }
        });
    } catch(e) { console.error('Stocking chart error:', e); return null; }
}
