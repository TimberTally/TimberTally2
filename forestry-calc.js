// =============================================================================
// forestry-calc.js — Forestry calculation functions
// Depends on: forestry-data.js (BA_CONST, volume tables, VALID_DOYLE_FC)
// =============================================================================

/**
 * Look up board-foot volume for a single tree.
 * @param {string} dbhStr  - DBH as string (even integers 4-40)
 * @param {string} logsStr - Log count as string, or 'Cull'
 * @param {string} logRule - 'Doyle' | 'Scribner' | 'International'
 * @param {number} formClass - Doyle form class (70-86), default 78
 * @returns {number} Board feet, or 0 if not found
 */
function getTreeVolume(dbhStr, logsStr, logRule, formClass = 78) {
    try {
        const dbhInt = parseInt(dbhStr, 10);
        if (isNaN(dbhInt) || dbhInt < 10) return 0;
        if (logsStr === 'Cull') return 0;
        const logsNum = parseFloat(logsStr);
        if (isNaN(logsNum) || logsNum <= 0) return 0;
        const logsKey = (Math.floor(logsNum * 2) / 2).toFixed(1);
        if (parseFloat(logsKey) <= 0) return 0;
        const tables = {
            Doyle: DOYLE_FC78_VOLUMES,
            Scribner: SCRIBNER_FC78_VOLUMES,
            International: INTERNATIONAL_FC78_VOLUMES
        };
        const table = tables[logRule];
        if (!table) return 0;
        const dbhEntry = table[String(dbhInt)];
        if (!dbhEntry || !Object.prototype.hasOwnProperty.call(dbhEntry, logsKey)) return 0;
        const baseVol = dbhEntry[logsKey];
        if (!baseVol || baseVol <= 0) return 0;
        if (logRule === 'Doyle') {
            let fc = parseInt(formClass, 10);
            if (!VALID_DOYLE_FC.includes(fc)) fc = 78;
            return fc === 78 ? baseVol : Math.round(baseVol * (fc / 78.0));
        }
        return baseVol;
    } catch (e) { return 0; }
}

/**
 * Classify a tree by DBH into a standard size class.
 * @param {number|string} dbh
 * @returns {string} Size class name
 */
function getDbhClass(dbh) {
    const n = parseFloat(dbh);
    if (isNaN(n)) return 'Invalid';
    if (n >= 2  && n <= 5.9)  return 'Sapling';
    if (n >= 6  && n <= 11.9) return 'Poletimber';
    if (n >= 12 && n <= 17.9) return 'Small Sawtimber';
    if (n >= 18 && n <= 23.9) return 'Medium Sawtimber';
    if (n >= 24)               return 'Large Sawtimber';
    return 'Other';
}

/**
 * Calculate the full forestry report for a subset of tree entries.
 * @param {Array}  dataSubset - Array of entry objects
 * @param {number} baf        - Basal Area Factor
 * @param {string} logRule    - Log rule name
 * @param {number} formClass  - Doyle form class
 * @returns {Object} Report with summary, standDistribution, speciesSummary1, speciesSummary2
 */
function calculateForestryReport(dataSubset, baf, logRule, formClass) {
    const report = { summary: {}, standDistribution: {}, speciesSummary1: {}, speciesSummary2: {} };
    if (!dataSubset || dataSubset.length === 0) return report;

    const plotNums = new Set(
        dataSubset.map(e => e?.plotNumber).filter(p => p != null && !isNaN(parseInt(p, 10)))
    );
    const numPlots = plotNums.size;
    if (numPlots === 0) { report.summary = { numberOfPlots: 0 }; return report; }

    let totTrees = 0, cutTrees = 0, totTpaSum = 0, totVolSum = 0, cutTpaSum = 0, cutVolSum = 0;
    const specData = {};
    const CLS_KEYS = ['Sapling','Poletimber','Small Sawtimber','Medium Sawtimber','Large Sawtimber','Other','Invalid'];
    const clsData = Object.fromEntries(CLS_KEYS.map(k => [k, {s:0,c:0,t:0,v:0,ct:0}]));

    dataSubset.forEach(entry => {
        if (!entry) return;
        const dbh = parseFloat(entry.dbh);
        const spec = entry.species;
        const isCut = entry.cutStatus === 'Yes';
        if (isNaN(dbh) || dbh <= 0 || !spec?.trim()) {
            clsData['Invalid'].s++;
            if (isCut) clsData['Invalid'].c++;
            return;
        }
        const dbhCls = getDbhClass(dbh);
        totTrees++;
        if (isCut) cutTrees++;
        const baT  = BA_CONST * Math.pow(dbh, 2);
        const tpaT = baT > 0 ? baf / baT : 0;
        const volT = getTreeVolume(entry.dbh, entry.logs, logRule, formClass);
        const vpaT = volT * tpaT;
        totTpaSum += tpaT; totVolSum += vpaT;
        if (isCut) { cutTpaSum += tpaT; cutVolSum += vpaT; }

        if (!specData[spec]) specData[spec] = {s:0,c:0,t:0,v:0,vS:0,vM:0,vL:0,tpaSap:0,tpaPole:0,tpaSaw:0};
        specData[spec].s++; specData[spec].t += tpaT; specData[spec].v += vpaT;
        if (isCut) specData[spec].c++;
        if (dbhCls === 'Small Sawtimber')  specData[spec].vS += vpaT;
        else if (dbhCls === 'Medium Sawtimber') specData[spec].vM += vpaT;
        else if (dbhCls === 'Large Sawtimber')  specData[spec].vL += vpaT;
        if      (dbhCls === 'Sapling')     specData[spec].tpaSap  += tpaT;
        else if (dbhCls === 'Poletimber')  specData[spec].tpaPole += tpaT;
        else if (dbhCls.includes('Sawtimber')) specData[spec].tpaSaw += tpaT;

        if (clsData[dbhCls]) {
            clsData[dbhCls].s++; clsData[dbhCls].t += tpaT; clsData[dbhCls].v += vpaT;
            if (isCut) { clsData[dbhCls].c++; clsData[dbhCls].ct += tpaT; }
        }
    });

    const tpa    = numPlots > 0 ? totTpaSum / numPlots : 0;
    const tpaCut = numPlots > 0 ? cutTpaSum / numPlots : 0;
    const volPA  = numPlots > 0 ? totVolSum / numPlots : 0;
    const baPA   = numPlots > 0 ? (totTrees * baf) / numPlots : 0;
    const baPACut= numPlots > 0 ? (cutTrees * baf) / numPlots : 0;
    const qmd    = tpa > 0 && baPA > 0 ? Math.sqrt((baPA / tpa) / BA_CONST) : 0;

    report.summary = {
        numberOfPlots: numPlots,
        totalTreesPerAcre: tpa, treesPerAcreCut: tpaCut, treesPerAcreLeave: tpa - tpaCut,
        totalBaPerAcre: baPA, baPerAcreCut: baPACut, baPerAcreLeave: baPA - baPACut,
        avgTractDbh: qmd,
        totalVolPerAcre: volPA,
        volumePerAcreCut: numPlots > 0 ? cutVolSum / numPlots : 0,
        volumePerAcreLeave: volPA - (numPlots > 0 ? cutVolSum / numPlots : 0),
        bafUsed: baf, logRuleUsed: logRule,
        formClassUsed: logRule === 'Doyle' ? formClass : 'N/A'
    };

    // Stand distribution by DBH class
    let sd = {percStems:0,baPA:0,baPACut:0,baPALeave:0,volPA:0,percBa:0,percVol:0,tpaCut:0,tpaLeave:0};
    CLS_KEYS.concat(['Invalid']).filter((v,i,a) => a.indexOf(v)===i).forEach(cls => {
        const ci = clsData[cls] || {s:0,c:0,t:0,v:0,ct:0};
        const clsTpa   = numPlots > 0 ? ci.t / numPlots : 0;
        const clsVol   = numPlots > 0 ? ci.v / numPlots : 0;
        const clsBa    = numPlots > 0 ? (ci.s * baf) / numPlots : 0;
        const clsBaCut = numPlots > 0 ? (ci.c * baf) / numPlots : 0;
        const clsTpaCut= numPlots > 0 ? ci.ct / numPlots : 0;
        const pStems = tpa   > 0 ? (clsTpa / tpa)   * 100 : 0;
        const pBa    = baPA  > 0 ? (clsBa  / baPA)  * 100 : 0;
        const pVol   = volPA > 0 ? (clsVol / volPA) * 100 : 0;
        report.standDistribution[cls] = {
            percentTotalStems: pStems, baSqFtPerAcreCut: clsBaCut,
            baSqFtPerAcreLeave: clsBa - clsBaCut, baSqFtPerAcreTotal: clsBa,
            percentBa: pBa, volumeBfPerAcre: clsVol, percentVolume: pVol,
            tpaPerAcreCut: clsTpaCut, tpaPerAcreLeave: clsTpa - clsTpaCut
        };
        sd.percStems += pStems; sd.baPA += clsBa; sd.baPACut += clsBaCut;
        sd.baPALeave += clsBa - clsBaCut; sd.volPA += clsVol;
        sd.percBa += pBa; sd.percVol += pVol;
        sd.tpaCut += clsTpaCut; sd.tpaLeave += clsTpa - clsTpaCut;
    });
    report.standDistribution['TOTALS'] = {
        percentTotalStems: sd.percStems, baSqFtPerAcreCut: sd.baPACut,
        baSqFtPerAcreLeave: sd.baPALeave, baSqFtPerAcreTotal: sd.baPA,
        percentBa: sd.percBa, volumeBfPerAcre: sd.volPA,
        percentVolume: sd.percVol, tpaPerAcreCut: sd.tpaCut, tpaPerAcreLeave: sd.tpaLeave
    };

    // Species composition
    const sortedSpecs = Object.keys(specData).sort();
    let ss1 = {percStems:0,percSaw:0,percPole:0,percSap:0};
    sortedSpecs.forEach(spec => {
        const sd = specData[spec];
        const spTpa  = numPlots > 0 ? sd.t / numPlots : 0;
        const pStems = tpa > 0 ? (spTpa / tpa) * 100 : 0;
        const pSaw   = tpa > 0 ? ((sd.tpaSaw   / numPlots) / tpa) * 100 : 0;
        const pPole  = tpa > 0 ? ((sd.tpaPole  / numPlots) / tpa) * 100 : 0;
        const pSap   = tpa > 0 ? ((sd.tpaSap   / numPlots) / tpa) * 100 : 0;
        report.speciesSummary1[spec] = {percentTotalStems:pStems,sawtimberPercent:pSaw,poletimberPercent:pPole,saplingPercent:pSap};
        ss1.percStems+=pStems; ss1.percSaw+=pSaw; ss1.percPole+=pPole; ss1.percSap+=pSap;
    });
    report.speciesSummary1['TOTALS'] = {percentTotalStems:ss1.percStems,sawtimberPercent:ss1.percSaw,poletimberPercent:ss1.percPole,saplingPercent:ss1.percSap};

    // Volume by species
    let ss2 = {v:0,vS:0,vM:0,vL:0,perc:0};
    sortedSpecs.forEach(spec => {
        const sd = specData[spec];
        const spVolA = numPlots > 0 ? sd.v  / numPlots : 0;
        const spVS   = numPlots > 0 ? sd.vS / numPlots : 0;
        const spVM   = numPlots > 0 ? sd.vM / numPlots : 0;
        const spVL   = numPlots > 0 ? sd.vL / numPlots : 0;
        const pVol   = volPA > 0 ? (spVolA / volPA) * 100 : 0;
        report.speciesSummary2[spec] = {volSmallPerAcre:spVS,volMediumPerAcre:spVM,volLargePerAcre:spVL,totalSpeciesVolPerAcre:spVolA,percentTotalVolume:pVol};
        ss2.v+=spVolA; ss2.vS+=spVS; ss2.vM+=spVM; ss2.vL+=spVL; ss2.perc+=pVol;
    });
    report.speciesSummary2['TOTALS'] = {volSmallPerAcre:ss2.vS,volMediumPerAcre:ss2.vM,volLargePerAcre:ss2.vL,totalSpeciesVolPerAcre:ss2.v,percentTotalVolume:ss2.perc};

    return report;
}

/**
 * Calculate per-plot volume statistics for a data subset.
 * @returns {Object|null} {meanV, stdDevV, cvV, numValidPlots, plotVolumes}
 */
function calculatePlotStats(dataSubset, baf, logRule, formClass) {
    if (!dataSubset?.length) return null;
    const plots = {};
    dataSubset.forEach(e => {
        if (e?.plotNumber) {
            const n = parseInt(e.plotNumber, 10);
            if (!isNaN(n)) { if (!plots[n]) plots[n] = []; plots[n].push(e); }
        }
    });
    const plotNums = Object.keys(plots).map(Number).sort((a, b) => a - b);
    if (!plotNums.length) return null;

    const plotVols = plotNums.map(pn => {
        let vpa = 0;
        plots[pn].forEach(t => {
            if (!t?.dbh || !t?.logs) return;
            const dbh = parseFloat(t.dbh);
            if (isNaN(dbh) || dbh <= 0) return;
            const ba = BA_CONST * Math.pow(dbh, 2);
            if (ba <= 0) return;
            vpa += getTreeVolume(t.dbh, t.logs, logRule, formClass) * (baf / ba);
        });
        return Math.round(vpa);
    });

    const n = plotVols.length;
    if (n < 2) return { meanV: n === 1 ? plotVols[0] : 0, stdDevV: 0, cvV: 0, numValidPlots: n, plotVolumes: plotVols };
    const mean     = plotVols.reduce((a, v) => a + v, 0) / n;
    const variance = plotVols.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev   = Math.sqrt(variance);
    return { meanV: mean, stdDevV: stdDev, cvV: mean !== 0 ? (stdDev / mean) * 100 : 0, numValidPlots: n, plotVolumes: plotVols };
}

/**
 * Build a tally object grouped by species → DBH → logs → cut status.
 * @param {Array} dataSubset
 * @returns {Object}
 */
function generateTallyData(dataSubset) {
    const tally = {};
    dataSubset.forEach(entry => {
        if (!entry) return;
        const { species, dbh, logs, cutStatus } = entry;
        if (!species || !dbh || !logs || !cutStatus) return;
        const kS = String(species), kD = String(dbh), kL = String(logs), kC = String(cutStatus);
        if (!tally[kS])          tally[kS]          = {};
        if (!tally[kS][kD])      tally[kS][kD]      = {};
        if (!tally[kS][kD][kL]) tally[kS][kD][kL]  = {};
        tally[kS][kD][kL][kC] = (tally[kS][kD][kL][kC] || 0) + 1;
    });
    return tally;
}

/**
 * Calculate per-area stocking stats for the Gingrich chart.
 * @param {Array}  collectedData - Full dataset
 * @param {number} baf
 * @returns {Array|null} Array of area stat objects, or null
 */
function calculateStandStocking(collectedData, baf) {
    if (!collectedData?.length) return null;
    const areas = [...new Set(collectedData.map(e => e.areaLetter).filter(Boolean))].sort();
    if (!areas.length) return null;

    return areas.map(area => {
        const areaData = collectedData.filter(e => e.areaLetter === area);
        const plots    = new Set(areaData.map(e => e.plotNumber).filter(p => p != null && !isNaN(parseInt(p, 10))));
        const numPlots = plots.size;
        if (numPlots === 0) return null;

        let totTrees = 0, cutTrees = 0, totTpaSum = 0, cutTpaSum = 0;
        areaData.forEach(entry => {
            const dbh = parseFloat(entry.dbh);
            if (isNaN(dbh) || dbh <= 0) return;
            const ba  = BA_CONST * Math.pow(dbh, 2);
            const tpa = ba > 0 ? baf / ba : 0;
            totTrees++; totTpaSum += tpa;
            if (entry.cutStatus === 'Yes') { cutTrees++; cutTpaSum += tpa; }
        });

        const totalTpa = numPlots > 0 ? totTpaSum / numPlots : 0;
        const cutTpa   = numPlots > 0 ? cutTpaSum / numPlots : 0;
        const leaveTpa = totalTpa - cutTpa;
        const totalBa  = numPlots > 0 ? (totTrees * baf) / numPlots : 0;
        const cutBa    = numPlots > 0 ? (cutTrees * baf) / numPlots : 0;
        const leaveBa  = totalBa - cutBa;

        const qmd = (tpa, ba) => tpa > 0 && ba > 0 ? Math.sqrt((ba / tpa) / BA_CONST) : 0;

        return {
            area, numPlots, totalTpa, cutTpa, leaveTpa,
            totalBa, cutBa, leaveBa,
            totalQmd: qmd(totalTpa, totalBa),
            cutQmd:   qmd(cutTpa,   cutBa),
            leaveQmd: qmd(leaveTpa, leaveBa)
        };
    }).filter(Boolean);
}

/**
 * Format a forestry report object as CSV-ready text.
 * @param {Object} report - Output of calculateForestryReport()
 * @returns {string}
 */
function formatReportForCsv(report) {
    const fmt  = (n, d = 1) => !isNaN(parseFloat(n)) ? parseFloat(n).toFixed(d) : '0.0';
    const fmtI = n => !isNaN(parseFloat(n)) ? parseFloat(n).toFixed(0) : '0';
    const fmtP = (n, d = 1) => !isNaN(parseFloat(n)) ? parseFloat(n).toFixed(d) + '%' : '0.0%';

    if (!report?.summary?.numberOfPlots) return "\n--- FORESTRY REPORT DATA ---\nError: Report incomplete.\n";

    const sum = report.summary;
    let csv = `\n\n--- FORESTRY REPORT DATA (BAF=${sum.bafUsed}, Rule=${sum.logRuleUsed}${sum.logRuleUsed === 'Doyle' ? ', FC=' + sum.formClassUsed : ''}) ---\n`;
    csv += `TOTAL VOLUME/ACRE (BF),${fmtI(sum.totalVolPerAcre)},,VOL/ACRE CUT (BF),${fmtI(sum.volumePerAcreCut)},,VOL/ACRE LEAVE (BF),${fmtI(sum.volumePerAcreLeave)}\n`;
    csv += `AVG DBH (QMD),${fmt(sum.avgTractDbh)},,TOTAL TREES/ACRE,${fmt(sum.totalTreesPerAcre)},,NUMBER OF PLOTS,${fmtI(sum.numberOfPlots)}\n`;
    csv += `TOTAL BA/ACRE,${fmt(sum.totalBaPerAcre)},,TREES/ACRE CUT,${fmt(sum.treesPerAcreCut)},,TREES/ACRE LEAVE,${fmt(sum.treesPerAcreLeave)}\n`;
    csv += `BA/ACRE CUT,${fmt(sum.baPerAcreCut)},,BA/ACRE LEAVE,${fmt(sum.baPerAcreLeave)}\n\n`;

    csv += "STAND DISTRIBUTION,STEMS (%),BA/ACRE CUT,BA/ACRE LEAVE,BA/ACRE TOTAL,BA (%),VOL/ACRE (BF),VOL (%),TPA CUT,TPA LEAVE\n";
    const CLS_ORDER = ['Sapling','Poletimber','Small Sawtimber','Medium Sawtimber','Large Sawtimber','Other','Invalid','TOTALS'];
    const CLS_LABEL = {
        'Sapling':'SAPLINGS (2-5.9")','Poletimber':'POLETIMBER (6-11.9")',
        'Small Sawtimber':'S SAW (12-17.9")','Medium Sawtimber':'M SAW (18-23.9")',
        'Large Sawtimber':'L SAW (24"+)','Other':'OTHER','Invalid':'INVALID','TOTALS':'TOTALS'
    };
    CLS_ORDER.forEach(cls => {
        const d = report.standDistribution[cls] || {};
        csv += `"${CLS_LABEL[cls] || cls}",${fmtP(d.percentTotalStems)},${fmt(d.baSqFtPerAcreCut)},${fmt(d.baSqFtPerAcreLeave)},${fmt(d.baSqFtPerAcreTotal)},${fmtP(d.percentBa)},${fmtI(d.volumeBfPerAcre)},${fmtP(d.percentVolume)},${fmt(d.tpaPerAcreCut)},${fmt(d.tpaPerAcreLeave)}\n`;
    });

    csv += "\nSPECIES COMPOSITION,STEMS (%),SAW (%),POLE (%),SAP (%)\n";
    [...Object.keys(report.speciesSummary1).filter(s => s !== 'TOTALS').sort(), 'TOTALS'].forEach(spec => {
        const d = report.speciesSummary1[spec] || {};
        csv += `"${spec}",${fmtP(d.percentTotalStems)},${fmtP(d.sawtimberPercent)},${fmtP(d.poletimberPercent)},${fmtP(d.saplingPercent)}\n`;
    });

    csv += '\nVOL/ACRE BY SPECIES,S SAW (12-17.9"),M SAW (18-23.9"),L SAW (24"+),TOTAL VOL/ACRE,VOL (%)\n';
    [...Object.keys(report.speciesSummary2).filter(s => s !== 'TOTALS').sort(), 'TOTALS'].forEach(spec => {
        const d = report.speciesSummary2[spec] || {};
        csv += `"${spec}",${fmtI(d.volSmallPerAcre)},${fmtI(d.volMediumPerAcre)},${fmtI(d.volLargePerAcre)},${fmtI(d.totalSpeciesVolPerAcre)},${fmtP(d.percentTotalVolume)}\n`;
    });

    return csv;
}
