javascript:
/*
bookmark name: /HN Favorites#

Search HN Favorites and Export to CSV or HTML.
It runs in your browser like a browser extension. It scrapes the HN HTML and navigates from page to page.

Setup:
Bookmark: Drag this to your bookmarks toolbar, or
Copy this code to the browser console or, if using Chrome, to a Snippet. For example:
1. Press F12 (Windows) to open DevTools.
2. Go to Sources > Snippets, click New Snippet.
3. Give it a name, eg, "HN Favorites".
4. Copy/paste the code from https://gabrielsroka.github.io/getHNFavorites.js
5. Save (Ctrl+S, Windows).

Usage:
Bookmark: Click the bookmark, or
1. Navigate your browser to https://news.ycombinator.com/user?id=YOUR_USER_ID
2. Press F12 (Windows) to open DevTools.
3. Run the code. If using a Snippet, there's a Run button on the bottom right, or press Ctrl+Enter (Windows).
4. Look for the popup window in the upper-left corner of your browser.
*/

(function () {
    const popup = createPopup('HN Favorites');
    if (location.host != 'news.ycombinator.com' || !(location.pathname == '/user' || location.pathname == '/favorites'))  {
        popup.innerHTML = 'ERROR: Go to your user page and then try again.';
        return;
    }
    const id = location.search.split('=')[1];
    const types = {
        csv: {
            header: 'Title,URL',
            filename: id + "'s HN favorites",
            totype: a => toCSV(a.title, a.link)
        },
        html: {
            header: '<title>' + id + "'s HN favorites</title><style>body {font-family: sans-serif;}</style><h1>" + id + "'s HN favorites</h1>",
            filename: id + "'s-HN-favorites",
            totype: a => `<p><a href="${a.link}" target="_blank" rel="noopener">${a.title}</a>`
        }
    };
    const favorites = [];
    popup.innerHTML = 
        '<button id=exportToCsv data-filetype=csv>Export to CSV</button><br><br>' + 
        '<button id=exportToHtml data-filetype=html>Export to HTML</button><br><br>' +
        '<input id=query> <button id=search>Search</button><br><br>' + 
        '<div id=results></div>';
    exportToCsv.onclick = exportToHtml.onclick = async function () {
        const filetype = this.dataset.filetype;
        await getFavorites();
        downloadFile(types[filetype].header, favorites.map(types[filetype].totype), types[filetype].filename, filetype);
        results.innerHTML = 'Finished exporting.';
    };
    search.onclick = async function () {
        const re = new RegExp(query.value, 'i');
        await getFavorites();
        const found = favorites.filter(f => f.title.match(re) || f.link.match(re)).map(types.html.totype);
        if (found.length == 0) {
            results.innerHTML = 'not found';
        } else {
            results.innerHTML = found.join('');
        }
    };
    async function getFavorites() {
        if (favorites.length > 0) return;
        var url = `/favorites?id=${id}`;
        var page = 1;
        do {
            results.innerHTML = `Fetching page ${page++} ...<br><br>`;
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            doc.querySelectorAll('a.titlelink').forEach(a => favorites.push({title: a.innerText, link: a.href}));
            const more = doc.querySelector('a.morelink');
            url = more?.href;
            await sleep(850);
        } while (url);
    }

    function createPopup(title) {
        const div = document.body.appendChild(document.createElement("div"));
        div.innerHTML = title + " <a onclick='document.body.removeChild(this.parentNode)' style='cursor: pointer; padding: 4px'>X</a><br><br>";
        div.style.position = "absolute";
        div.style.zIndex = "1000";
        div.style.left = "4px";
        div.style.top = "4px";
        div.style.backgroundColor = "white";
        div.style.border = '1px solid #ddd';
        return div.appendChild(document.createElement("div"));
    }
    function toCSV(...fields) {
        return fields.map(field => `"${field == undefined ? "" : field.toString().replace(/"/g, '""')}"`).join(',');
    }
    function downloadFile(header, lines, filename, filetype) {
        const a = document.body.appendChild(document.createElement('a'));
        a.href = URL.createObjectURL(new Blob([header + "\n" + lines.join("\n")], {type: 'text/' + filetype}));
        const date = (new Date()).toISOString().replace(/[T:]/g, "-").slice(0, 19);
        a.download = `${filename}-${date}.${filetype}`;
        a.click();
    }
    function sleep(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
})();
