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
// Axes: X = Trees Per Acre (TPA), Y = Basal Area / Acre (sq ft)
// Reference: Gingrich (1967) upland hardwoods stocking guide
// =============================================================================

// Gingrich curve data: [TPA, BA/Acre]
const GINGRICH_A_PTS = [
    [20,40],[40,60],[60,75],[80,88],[100,100],
    [150,120],[200,136],[300,158],[400,172]
];
const GINGRICH_B_PTS = [
    [50,15],[100,30],[150,45],[200,58],
    [300,80],[400,98],[500,114],[600,128]
];

function _gingrichInterpolate(pts, tpa) {
    if (tpa <= pts[0][0]) return pts[0][1];
    if (tpa >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (let i = 0; i < pts.length - 1; i++) {
        if (tpa >= pts[i][0] && tpa <= pts[i + 1][0]) {
            const t = (tpa - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
            return pts[i][1] + t * (pts[i + 1][1] - pts[i][1]);
        }
    }
    return null;
}

function _buildGingrichCurve(pts, xMax, step = 10) {
    const result = [];
    const xStart = pts[0][0];
    const xEnd   = Math.min(xMax, pts[pts.length - 1][0]);
    for (let x = xStart; x <= xEnd; x += step) {
        result.push({ x, y: _gingrichInterpolate(pts, x) });
    }
    if (result[result.length - 1]?.x < xEnd) {
        result.push({ x: xEnd, y: _gingrichInterpolate(pts, xEnd) });
    }
    return result;
}

/**
 * Build and return a Gingrich stocking chart on the provided canvas.
 * X-axis = TPA, Y-axis = BA/Acre (sq ft)
 * Plots Total, Cut, and Leave points per area with area letter labels.
 * @param {Array}       areaStats   - Output of calculateStandStocking()
 * @param {HTMLElement} canvas
 * @returns {Chart|null}
 */
function buildStockingChart(areaStats, canvas) {
    if (!areaStats?.length || !canvas) return null;

    // Determine axis ranges from data
    const allTpa = areaStats.flatMap(s => [s.totalTpa, s.cutTpa, s.leaveTpa].filter(v => v > 0));
    const maxTpa = Math.max(600, ...allTpa) * 1.1;
    const xMax = Math.ceil(maxTpa / 100) * 100;

    const aLineData = _buildGingrichCurve(GINGRICH_A_PTS, xMax);
    const bLineData = _buildGingrichCurve(GINGRICH_B_PTS, xMax);

    const datasets = [
        {
            label: 'A-Line (Full Stocking)',
            data: aLineData,
            showLine: true,
            borderColor: '#333',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            fill: false,
            order: 2,
            type: 'line'
        },
        {
            label: 'B-Line (Min Full Stocking)',
            data: bLineData,
            showLine: true,
            borderColor: '#888',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false,
            order: 2,
            type: 'line'
        }
    ];

    // One scatter dataset per area — Total (circle), Cut (triangle), Leave (rect)
    areaStats.forEach((s, i) => {
        const color = AREA_COLORS[i % AREA_COLORS.length];
        const pts = [];
        if (s.totalTpa > 0 && s.totalBa > 0) pts.push({ x: s.totalTpa, y: s.totalBa, ptLabel: `${s.area} Total`, shape: 'circle' });
        if (s.cutTpa   > 0 && s.cutBa   > 0) pts.push({ x: s.cutTpa,   y: s.cutBa,   ptLabel: `${s.area} Cut`,   shape: 'triangle' });
        if (s.leaveTpa > 0 && s.leaveBa > 0) pts.push({ x: s.leaveTpa, y: s.leaveBa, ptLabel: `${s.area} Leave`, shape: 'rect' });
        if (!pts.length) return;
        datasets.push({
            label: `Area ${s.area}`,
            data: pts,
            backgroundColor: pts.map((_, pi) => pi === 0 ? color : pi === 1 ? `${color}bb` : `${color}77`),
            borderColor: '#000',
            borderWidth: 1.5,
            pointStyle: pts.map(p => p.shape),
            pointRadius: 10,
            pointHoverRadius: 12,
            type: 'scatter',
            order: 1
        });
    });

    const labelPlugin = {
        id: 'areaLabels',
        afterDraw(chart) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((ds, di) => {
                if (ds.type !== 'scatter' || !ds.data?.length) return;
                const meta = chart.getDatasetMeta(di);
                meta.data.forEach((pt, pi) => {
                    const raw = ds.data[pi];
                    const letter = (raw.ptLabel || '').replace(/^(.*)\s(Total|Cut|Leave)$/, '$1').trim();
                    ctx.save();
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(letter, pt.x, pt.y);
                    ctx.restore();
                });
            });
        }
    };

    try {
        return new Chart(canvas, {
            type: 'scatter',
            data: { datasets },
            options: {
                animation: false,
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Gingrich Stocking Guide — Upland Hardwoods',
                        font: { size: 14, weight: 'bold' },
                        color: '#1e2d0f'
                    },
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 11 }, usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => {
                                const pt = ctx.raw;
                                if (pt.ptLabel) return `${pt.ptLabel}: TPA=${pt.x.toFixed(1)}, BA=${pt.y.toFixed(1)} sq ft/ac`;
                                return `TPA: ${pt.x}, BA: ${pt.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: 0,
                        max: xMax,
                        title: { display: true, text: 'Trees Per Acre (TPA)', font: { size: 12, weight: 'bold' }, color: '#3d4d2e' }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        title: { display: true, text: 'Basal Area / Acre (sq ft)', font: { size: 12, weight: 'bold' }, color: '#3d4d2e' },
                        beginAtZero: true
                    }
                }
            },
            plugins: [labelPlugin]
        });
    } catch(e) { console.error('Stocking chart error:', e); return null; }
}

// =============================================================================
// GINGRICH EXPORT — fixed-size version for PNG download
// =============================================================================

/**
 * Build a fixed-size (1200×700) Gingrich chart for PNG export.
 * @param {Array}       areaStats  - Output of calculateStandStocking()
 * @param {HTMLElement} canvas
 * @returns {Chart|null}
 */
function buildStockingChartExport(areaStats, canvas) {
    if (!areaStats?.length || !canvas) return null;

    const allTpa = areaStats.flatMap(s => [s.totalTpa, s.cutTpa, s.leaveTpa].filter(v => v > 0));
    const maxTpa = Math.max(600, ...allTpa) * 1.15;
    const xMax   = Math.ceil(maxTpa / 100) * 100;

    const aLineData = _buildGingrichCurve(GINGRICH_A_PTS, xMax, 5);
    const bLineData = _buildGingrichCurve(GINGRICH_B_PTS, xMax, 5);

    const datasets = [
        {
            label: 'A-Line (Full Stocking)',
            data: aLineData, showLine: true,
            borderColor: '#333', backgroundColor: 'transparent',
            borderWidth: 2.5, borderDash: [8, 4], pointRadius: 0, fill: false, order: 2, type: 'line'
        },
        {
            label: 'B-Line (Min Full Stocking)',
            data: bLineData, showLine: true,
            borderColor: '#888', backgroundColor: 'transparent',
            borderWidth: 2.5, borderDash: [5, 5], pointRadius: 0, fill: false, order: 2, type: 'line'
        }
    ];

    areaStats.forEach((s, i) => {
        const color = AREA_COLORS[i % AREA_COLORS.length];
        const pts = [];
        if (s.totalTpa > 0 && s.totalBa > 0) pts.push({ x: s.totalTpa, y: s.totalBa, ptLabel: `${s.area} Total`,  shape: 'circle'   });
        if (s.cutTpa   > 0 && s.cutBa   > 0) pts.push({ x: s.cutTpa,   y: s.cutBa,   ptLabel: `${s.area} Cut`,    shape: 'triangle' });
        if (s.leaveTpa > 0 && s.leaveBa > 0) pts.push({ x: s.leaveTpa, y: s.leaveBa, ptLabel: `${s.area} Leave`,  shape: 'rect'     });
        if (!pts.length) return;
        datasets.push({
            label: `Area ${s.area}`,
            data: pts,
            backgroundColor: pts.map((_, pi) => pi === 0 ? color : pi === 1 ? `${color}bb` : `${color}77`),
            borderColor: '#000', borderWidth: 1.5,
            pointStyle: pts.map(p => p.shape),
            pointRadius: 13, pointHoverRadius: 15,
            type: 'scatter', order: 1
        });
    });

    const labelPlugin = {
        id: 'areaLabelsExport',
        afterDraw(chart) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((ds, di) => {
                if (ds.type !== 'scatter' || !ds.data?.length) return;
                const meta = chart.getDatasetMeta(di);
                meta.data.forEach((pt, pi) => {
                    const raw = ds.data[pi];
                    const letter = (raw.ptLabel || '').replace(/^(.*)\s(Total|Cut|Leave)$/, '$1').trim();
                    ctx.save();
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(letter, pt.x, pt.y);
                    ctx.restore();
                });
            });
        }
    };

    try {
        return new Chart(canvas, {
            type: 'scatter',
            data: { datasets },
            options: {
                animation: false, responsive: false, maintainAspectRatio: false,
                plugins: {
                    customCanvasBackgroundColor: { color: 'white' },
                    title: {
                        display: true,
                        text: 'Gingrich Stocking Guide — Upland Hardwoods',
                        font: { size: 18, weight: 'bold' }, color: '#000'
                    },
                    legend: { position: 'bottom', labels: { font: { size: 13 }, usePointStyle: true, color: '#000' } },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { type: 'linear', min: 0, max: xMax,
                         title: { display: true, text: 'Trees Per Acre (TPA)', font: { size: 14, weight: 'bold' }, color: '#000' },
                         ticks: { color: '#000', font: { size: 12 } }, grid: { color: '#ddd' } },
                    y: { type: 'linear', min: 0, beginAtZero: true,
                         title: { display: true, text: 'Basal Area / Acre (sq ft)', font: { size: 14, weight: 'bold' }, color: '#000' },
                         ticks: { color: '#000', font: { size: 12 } }, grid: { color: '#ddd' } }
                }
            },
            plugins: [labelPlugin]
        });
    } catch(e) { console.error('Stocking export chart error:', e); return null; }
}

// =============================================================================
// SUMMARY REPORT PNG — landscape one-pager of the forestry report data
// =============================================================================

/**
 * Draw a landscape summary report PNG from a forestry report object.
 * Returns the canvas (1400×900) with everything drawn — no Chart.js needed.
 * @param {Object} report     - Output of calculateForestryReport()
 * @param {Object} plotStats  - Output of calculatePlotStats()
 * @param {string} areaLetter
 * @param {string} projectName
 * @param {string} logRule
 * @param {number} formClass
 * @param {number} baf
 * @returns {HTMLCanvasElement|null}
 */
function buildSummaryReportCanvas(report, plotStats, areaLetter, projectName, logRule, formClass, baf) {
    if (!report?.summary?.numberOfPlots) return null;

    // Logical layout dimensions — all coordinates written in these units
    const LW = 1400, LH = 900;
    // 3x scale = crisp at 100% zoom, roughly 300 DPI on an 11" wide print
    const SCALE = 3;
    const canvas = document.createElement('canvas');
    canvas.width  = LW * SCALE;
    canvas.height = LH * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    const C = {
        bg: '#ffffff', header: '#2d5016', headerTx: '#ffffff',
        section: '#3d6b20', secTx: '#ffffff',
        rowAlt: '#f0f6e8', border: '#b8d4a0',
        dark: '#1e2d0f', mid: '#3d4d2e', muted: '#6c7a55',
    };

    const fmt1 = n => (n != null && !isNaN(n)) ? parseFloat(n).toFixed(1) : '\u2014';
    const fmt0 = n => (n != null && !isNaN(n)) ? Math.round(n).toLocaleString() : '\u2014';
    const fmtP = n => (n != null && !isNaN(n)) ? parseFloat(n).toFixed(1) + '%' : '\u2014';

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, LW, LH);

    // Header bar
    ctx.fillStyle = C.header;
    ctx.fillRect(0, 0, LW, 64);
    ctx.fillStyle = C.headerTx;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('TimberTally \u2014 Forestry Report Summary', 20, 42);
    ctx.font = '15px sans-serif';
    const ruleStr = logRule + (logRule === 'Doyle' ? ' FC' + formClass : '') + '  |  BAF ' + baf;
    const headerRight = 'Project: ' + (projectName || 'Untitled') + '   Area: ' + areaLetter + '   ' + ruleStr + '   ' + new Date().toLocaleDateString();
    ctx.textAlign = 'right';
    ctx.fillText(headerRight, LW - 20, 42);
    ctx.textAlign = 'left';

    const sum = report.summary;

    // Key stat boxes
    const statBoxes = [
        { label: 'Total Vol/Acre (BF)', value: fmt0(sum.totalVolPerAcre) },
        { label: 'Vol/Acre Cut (BF)',   value: fmt0(sum.volumePerAcreCut) },
        { label: 'Vol/Acre Leave (BF)', value: fmt0(sum.volumePerAcreLeave) },
        { label: 'Total TPA',           value: fmt1(sum.totalTreesPerAcre) },
        { label: 'TPA Cut',             value: fmt1(sum.treesPerAcreCut) },
        { label: 'TPA Leave',           value: fmt1(sum.treesPerAcreLeave) },
        { label: 'Total BA/Acre',       value: fmt1(sum.totalBaPerAcre) },
        { label: 'Avg DBH (QMD)',       value: fmt1(sum.avgTractDbh) + '"' },
        { label: 'Num Plots',           value: String(sum.numberOfPlots) },
    ];
    const statH = 62, bW = Math.floor(LW / statBoxes.length);
    statBoxes.forEach(function(b, i) {
        const x = i * bW;
        ctx.fillStyle = i % 2 === 0 ? '#eaf4de' : '#f5faf0';
        ctx.fillRect(x, 65, bW, statH);
        ctx.strokeStyle = C.border; ctx.lineWidth = 0.75;
        ctx.strokeRect(x, 65, bW, statH);
        ctx.fillStyle = C.dark;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.value, x + bW / 2, 93);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = C.muted;
        ctx.fillText(b.label, x + bW / 2, 114);
        ctx.textAlign = 'left';
    });

    function sectionHeader(label, x, y, w) {
        ctx.fillStyle = C.section;
        ctx.fillRect(x, y, w, 24);
        ctx.fillStyle = C.secTx;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(label, x + 8, y + 16);
    }

    function drawTable(headers, rows, x, y, colWidths, rowH) {
        rowH = rowH || 21;
        const tableW = colWidths.reduce(function(a,b){return a+b;}, 0);
        ctx.fillStyle = '#d4eabf';
        ctx.fillRect(x, y, tableW, rowH);
        ctx.lineWidth = 0.5;
        let cx = x;
        headers.forEach(function(h, i) {
            ctx.strokeStyle = C.border;
            ctx.strokeRect(cx, y, colWidths[i], rowH);
            ctx.fillStyle = C.dark;
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = i === 0 ? 'left' : 'right';
            ctx.fillText(h, i === 0 ? cx + 5 : cx + colWidths[i] - 5, y + 14);
            cx += colWidths[i];
        });
        ctx.textAlign = 'left';
        rows.forEach(function(row, ri) {
            const ry = y + rowH * (ri + 1);
            const isTotals = ri === rows.length - 1;
            ctx.fillStyle = isTotals ? '#daefc8' : (ri % 2 === 0 ? C.bg : C.rowAlt);
            ctx.fillRect(x, ry, tableW, rowH);
            cx = x;
            row.forEach(function(cell, ci) {
                ctx.strokeStyle = C.border;
                ctx.strokeRect(cx, ry, colWidths[ci], rowH);
                ctx.fillStyle = C.dark;
                ctx.font = (isTotals ? 'bold ' : '') + '11px sans-serif';
                ctx.textAlign = ci === 0 ? 'left' : 'right';
                ctx.fillText(String(cell), ci === 0 ? cx + 5 : cx + colWidths[ci] - 5, ry + 14);
                cx += colWidths[ci];
            });
            ctx.textAlign = 'left';
        });
        return y + rowH * (rows.length + 1) + 6;
    }

    const CONTENT_TOP = 138, ROW_H = 21, SEC_H = 24, GAP = 10;
    const leftX = 12, leftW = 628, rightX = 648, rightW = LW - 648 - 12;

    // Stand Distribution
    sectionHeader('STAND DISTRIBUTION', leftX, CONTENT_TOP, leftW);
    const CLS_ORDER = ['Sapling','Poletimber','Small Sawtimber','Medium Sawtimber','Large Sawtimber','Other','Invalid','TOTALS'];
    const CLS_SHORT = {
        'Sapling':'Saplings (2-5.9")','Poletimber':'Poletimber (6-11.9")',
        'Small Sawtimber':'S Saw (12-17.9")','Medium Sawtimber':'M Saw (18-23.9")',
        'Large Sawtimber':'L Saw (24+")','Other':'Other','Invalid':'Invalid','TOTALS':'TOTALS'
    };
    const distRows = CLS_ORDER.map(function(cls) {
        const d = report.standDistribution[cls] || {};
        return [CLS_SHORT[cls]||cls, fmtP(d.percentTotalStems),
                fmt1(d.baSqFtPerAcreTotal), fmt1(d.baSqFtPerAcreCut), fmt1(d.baSqFtPerAcreLeave),
                fmtP(d.percentBa), fmt0(d.volumeBfPerAcre), fmtP(d.percentVolume)];
    });
    const afterDist = drawTable(
        ['Size Class','Stems%','BA/Ac','BA Cut','BA Lv','BA%','Vol/Ac','Vol%'],
        distRows, leftX, CONTENT_TOP + SEC_H, [162,58,58,58,58,52,72,52], ROW_H
    );

    // Species Composition
    sectionHeader('SPECIES COMPOSITION (% of TPA)', leftX, afterDist + GAP, leftW);
    const specs1 = Object.keys(report.speciesSummary1).filter(function(s){return s!=='TOTALS';}).sort().concat(['TOTALS']);
    const spec1Rows = specs1.map(function(sp) {
        const d = report.speciesSummary1[sp] || {};
        return [sp, fmtP(d.percentTotalStems), fmtP(d.sawtimberPercent), fmtP(d.poletimberPercent), fmtP(d.saplingPercent)];
    });
    drawTable(['Species','Stems%','Saw%','Pole%','Sap%'], spec1Rows, leftX, afterDist + GAP + SEC_H, [162,116,116,117,117], ROW_H);

    // Volume by Species
    sectionHeader('VOLUME / ACRE BY SPECIES (Board Feet)', rightX, CONTENT_TOP, rightW);
    const specs2 = Object.keys(report.speciesSummary2).filter(function(s){return s!=='TOTALS';}).sort().concat(['TOTALS']);
    const spec2Rows = specs2.map(function(sp) {
        const d = report.speciesSummary2[sp] || {};
        return [sp, fmt0(d.volSmallPerAcre), fmt0(d.volMediumPerAcre), fmt0(d.volLargePerAcre),
                fmt0(d.totalSpeciesVolPerAcre), fmtP(d.percentTotalVolume)];
    });
    const afterVol = drawTable(
        ['Species','S Saw (12-17.9")','M Saw (18-23.9")','L Saw (24+")','Total Vol/Ac','Vol%'],
        spec2Rows, rightX, CONTENT_TOP + SEC_H, [148,112,112,112,126,80], ROW_H
    );

    // Plot Stats
    if (plotStats && plotStats.numValidPlots > 0) {
        sectionHeader('PLOT VOLUME STATISTICS', rightX, afterVol + GAP, rightW);
        const psRows = [['Num Plots', String(plotStats.numValidPlots)], ['Mean BF/Acre', fmt1(plotStats.meanV)]];
        if (plotStats.numValidPlots > 1) {
            psRows.push(['Std Dev', fmt1(plotStats.stdDevV)]);
            psRows.push(['CV (%)', fmt1(plotStats.cvV)]);
        }
        drawTable(['Statistic','Value'], psRows, rightX, afterVol + GAP + SEC_H, [240,210], ROW_H);
    }

    // Footer
    ctx.fillStyle = C.header;
    ctx.fillRect(0, LH - 24, LW, 24);
    ctx.fillStyle = C.headerTx;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by TimberTally  \u2022  Gingrich (1967) stocking reference  \u2022  All volumes in Board Feet per Acre', LW / 2, LH - 8);
    ctx.textAlign = 'left';

    return canvas;
}
