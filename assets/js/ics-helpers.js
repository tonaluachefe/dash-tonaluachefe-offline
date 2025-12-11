// Helper: build human-readable RRULE preview
window.buildRRulePreview = function({freq, interval, until, byday}) {
    if (!freq || freq === 'Única') return '';
    const freqNames = { 'Diária': 'diária', 'Semanal': 'semanal', 'Mensal': 'mensal' };
    const freqText = freqNames[freq] || freq;
    const dayNames = { 'MO': 'seg', 'TU': 'ter', 'WE': 'qua', 'TH': 'qui', 'FR': 'sex', 'SA': 'sáb', 'SU': 'dom' };
    let text = `Recorre ${freqText}`;
    if (interval && interval > 1) text += ` (a cada ${interval})`;
    if (byday && byday.length > 0) text += ` nos ${byday.map(d => dayNames[d] || d).join(', ')}`;
    if (until) text += ` até ${until}`;
    return text;
};

// Helper: build RRULE string from task recurrence options
window.buildRRuleFromOptions = function({freq, interval, until, byday, startDate}) {
    if (!freq || freq === 'Única') return null;
    let freqStr = '';
    if (freq === 'Diária') freqStr = 'FREQ=DAILY';
    else if (freq === 'Semanal') freqStr = 'FREQ=WEEKLY';
    else if (freq === 'Mensal') freqStr = 'FREQ=MONTHLY';
    if (!freqStr) return null;

    let rrule = freqStr;
    if (interval && interval > 1) rrule += `;INTERVAL=${interval}`;
    if (byday && byday.length > 0) rrule += `;BYDAY=${byday.join(',')}`;
    if (until) {
        // converter YYYY-MM-DD para YYYYMMDDTZ
        const parts = until.split('-');
        rrule += `;UNTIL=${parts[0]}${parts[1]}${parts[2]}T000000Z`;
    }
    return 'RRULE:' + rrule;
};

// Helper: generate iCalendar (.ics) content
window.generateIcs = function({title, details, location, startDate, endDate, rrule}) {
    const formatDate = (d) => {
        if (!d) return '';
        const dt = d instanceof Date ? d : new Date(d);
        const pad = (n) => String(n).padStart(2, '0');
        return dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate()) + 'T' + pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + pad(dt.getUTCSeconds()) + 'Z';
    };
    const escapedTitle = (title || 'Event').replace(/[\r\n]/g, '\\n');
    const escapedDetails = (details || '').replace(/[\r\n]/g, '\\n');
    const escapedLocation = (location || '').replace(/[\r\n]/g, '\\n');
    const uid = 'task-' + Date.now() + '@offline';
    const now = formatDate(new Date());
    const start = formatDate(startDate || new Date());
    const end = formatDate(endDate || new Date((new Date()).getTime() + 30*60000));

    let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Dash Tarefas//PT\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nDTSTAMP:${now}\nUID:${uid}\nSUMMARY:${escapedTitle}\nDESCRIPTION:${escapedDetails}\nLOCATION:${escapedLocation}\n`;
    if (rrule) ics += `${rrule}\n`;
    ics += `END:VEVENT\nEND:VCALENDAR`;
    return ics;
};

// Helper: trigger .ics file download
window.downloadIcs = function(icsContent, filename) {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'evento.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
