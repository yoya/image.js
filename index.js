"use strict";
/*
 * index.html: search filter and match highlight of the function list
 */

// filter the function list by the search box
const search = document.querySelector(".search");
search.addEventListener("input", function() {
  const q = search.value.trim().toLowerCase();
  let total = 0;
  for (const cat of document.querySelectorAll(".category")) {
    let n = 0;
    for (const li of cat.querySelectorAll("li")) {
      const hit = (q === "") || li.textContent.toLowerCase().includes(q);
      li.hidden = ! hit;
      if (hit) { n++; }
    }
    cat.hidden = (n === 0);
    const d = cat.querySelector("details");
    if (d) { d.open = (q !== "") && (n > 0); }
    total += n;
  }
  document.querySelector(".noMatch").hidden = (total > 0);
  highlightMatches(q);
});

// highlight the matched characters (CSS Custom Highlight API;
// the DOM is not modified. no highlight on older browsers)
function highlightMatches(q) {
  if (! (window.CSS && CSS.highlights && window.Highlight)) {
    return;
  }
  CSS.highlights.delete("search");
  if (q === "") {
    return;
  }
  const ranges = [];
  for (const li of document.querySelectorAll(".category li:not([hidden])")) {
    // join the text nodes, so that a match across nodes is found too
    const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let text = "";
    for (let node = walker.nextNode() ; node ; node = walker.nextNode()) {
      nodes.push({ node, start: text.length });
      text += node.data.toLowerCase();
    }
    const locate = function(pos, isEnd) {
      for (let i = nodes.length - 1 ; i >= 0 ; i--) {
        if ((nodes[i].start < pos) || ((! isEnd) && (nodes[i].start === pos))) {
          return [nodes[i].node, pos - nodes[i].start];
        }
      }
      return [nodes[0].node, 0];
    };
    for (let pos = text.indexOf(q) ; pos >= 0 ; pos = text.indexOf(q, pos + q.length)) {
      const range = new Range();
      range.setStart(...locate(pos, false));
      range.setEnd(...locate(pos + q.length, true));
      ranges.push(range);
    }
  }
  CSS.highlights.set("search", new Highlight(...ranges));
}
