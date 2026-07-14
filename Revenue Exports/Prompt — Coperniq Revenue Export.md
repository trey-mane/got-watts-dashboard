# Prompt: Coperniq 2026 Revenue Export

Use this prompt to have Claude export all active projects from the Coperniq "🎯 2026 Revenue Tracking" smart view into a CSV.

---

## Prompt

> Go to https://app.coperniq.io/64/project-portfolio?smartViewId=15112 in Chrome.
>
> Change "Group by" from "Workflow" to "None" so all projects appear in a single flat list. Do NOT click Save — this would overwrite the saved smart view.
>
> Set "Show" to 50 (projects per page).
>
> Scroll through the entire list, collecting every project row into a deduplicated JavaScript map keyed by project number. Use virtual scroll collection: after each scroll, parse all visible `<tr>` elements with 7+ `<td>` cells and store new entries. Click any "Load more (N)" buttons that appear. Repeat until no new rows are added.
>
> Export columns: Project Name, Address, Project #, Workflow Stage, Trades, Status, Project Value, Sales Rep, Created At, Phone, Lead Source.
>
> Save the result as a CSV to: `/Users/treymicheletti/Desktop/got-watts-dashboard/Revenue Exports/2026 Revenue (MM-DD-YY).csv`
> Use today's date in the filename.

---

## Technical Notes for Claude

### Why virtual scroll collection is required
Coperniq's project table only renders ~15 DOM rows at a time. Rows outside the viewport are removed from the DOM entirely, so you can't read all rows in one pass. You must scroll, collect visible rows, scroll again, and repeat.

### Cell parsing
All project metadata lives in `td[0]` of each row. Parse it with:
```javascript
function p0(t) {
  const l = t.split('\n').map(s => s.trim()).filter(s => s && s !== '·' && !/^x\d$/.test(s) && !/^\d$/.test(s));
  return {
    name: l[0] || '',
    address: l.find(x => /\d+.*(?:St\b|Dr\b|Ave\b|Rd\b|Blvd\b|Pl\b|Ct\b|Way\b|CA\b)/i.test(x)) || '',
    projNum: l.find(x => /^#\d+$/.test(x)) || '',
    stage: l.find(x => /Stage|Visit|Engineer|Permit|Install|Commission|Utility|Closeout|Contract\b|Survey|PTO|Escalation|Intake|Design|Completed|Subcontract/i.test(x)) || ''
  };
}
```

Sales rep cell (`td[4]`) sometimes has 2-letter initials on the first line (e.g. `"IR\nIsaac Rothenberg"`). Strip them:
```javascript
function pSR(t) {
  const l = t.split('\n').map(s => s.trim()).filter(Boolean);
  return (l.length >= 2 && /^[A-Z]{2}$/.test(l[0])) ? l[1] : l[0] || '';
}
```

### Collection loop (run after each scroll)
```javascript
let added = 0;
[...document.querySelectorAll('tr')]
  .filter(tr => tr.querySelectorAll('td').length >= 7)
  .forEach(tr => {
    const tds = tr.querySelectorAll('td');
    const { name, address, projNum, stage } = p0(tds[0].innerText);
    if (!name || !projNum || window.__projects[projNum]) return;
    window.__projects[projNum] = [
      name, address, projNum, stage,
      tds[1].innerText.trim().replace(/\s+/g, ' '),
      tds[2].innerText.trim(),
      tds[3].innerText.trim(),
      pSR(tds[4].innerText),
      tds[5].innerText.trim().replace(/\s+/g, ' '),
      tds[6].innerText.trim(),
      tds[7] ? tds[7].innerText.trim() : ''
    ];
    added++;
  });
`+${added} new, total: ${Object.keys(window.__projects).length}`;
```

Initialize before starting: `window.__projects = {};`

### CSV export (run once collection is complete)
```javascript
// Fix addresses where parsing failed (address = name means it was wrong)
Object.values(window.__projects).forEach(r => {
  if (r[1] === r[0] || !/\d/.test(r[1])) r[1] = '';
});

function esc(s) {
  if (!s) s = '';
  s = String(s).trim().replace(/\s+/g, ' ');
  if (s.includes(',') || s.includes('"') || s.includes('\n'))
    return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

const header = 'Project Name,Address,Project #,Workflow Stage,Trades,Status,Project Value,Sales Rep,Created At,Phone,Lead Source';
const rows = Object.values(window.__projects).map(r => r.map(esc).join(','));
const csv = header + '\n' + rows.join('\n');
document.body.innerHTML = '<pre id="csvout">' + csv.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</pre>';
csv.length + ' chars, ' + rows.length + ' rows';
```

Then use `get_page_text` to extract the CSV content and write it to the file with the `Write` tool.

---

## Common Pitfalls

**1. The CSV export button doesn't work for interception**
Coperniq's export fires a GraphQL request from a Web Worker context, so overriding `window.fetch` in the main page never intercepts it. Don't waste time trying to intercept the network request — go straight to DOM scraping.

**2. Setting `scrollTop` directly doesn't load new rows**
`element.scrollTop = 700` updates the DOM property but does NOT fire the native scroll events that React listens to. New rows never load. Fix: use the Chrome MCP `scroll` action with `coordinate` targeting the table area — this fires real browser events and triggers re-renders.

**3. "Group by: Workflow" only shows one stage at a time**
In the default Kanban view, each column is a single workflow stage. Switching to "Group by: None" is required to get all stages in one scrollable list. Without this change, you'll only capture whichever stage column is currently visible.

**4. SAVE button will overwrite the smart view**
Changing Group by or Show triggers a floating "SAVE" button in the top-right. Do not click it. Clicking it permanently overwrites the saved smart view settings for everyone. Just ignore it — navigating away discards the change.

**5. Address parsing fails for truncated cells**
The `td[0]` cell text is often clipped (e.g. "1543 Josephine St, Berkel..."). The address regex usually still works if a street suffix is visible, but some rows will have no address captured. These show as blank in the CSV — that's correct behavior. Do not confuse blank address with a parsing bug.

**6. Sales rep shows raw initials (e.g. "IR Isaac Rothenberg")**
Some rep avatars prepend a 2-letter initial string on the first line of `td[4].innerText`. The `pSR()` function handles this by detecting a 2-char all-caps first line and skipping it. If you omit `pSR()` and use `innerText` directly, you'll get "IR Isaac Rothenberg" in the Sales Rep column.

**7. `await` at top level causes SyntaxError**
Running `await somePromise` at the top level of `javascript_exec` throws `SyntaxError: await is only valid in async functions`. Wrap in `(async () => { ... })()` or restructure to avoid `await` entirely.

**8. Chrome extension disconnects mid-batch**
Transient disconnects can occur during long `browser_batch` sequences. If this happens, `window.__projects` survives — the JavaScript heap is unaffected by the MCP connection dropping. Reconnect, verify the count with `Object.keys(window.__projects).length`, and continue scrolling from wherever you left off.

**9. "Load more (N)" button must be clicked**
Coperniq loads 50 rows initially, then shows a "Load more (N)" button when more exist. You must click it (potentially multiple times) to expose the remaining batches before scrolling to collect them.
