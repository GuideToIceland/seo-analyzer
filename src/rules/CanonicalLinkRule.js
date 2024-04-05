/**
 * Checks the presence and validity of the canonical link in the provided DOM.
 * @param {import('node-html-parser').HTMLElement} dom The node-html-parser object representing the HTML document.
 * @returns {Promise<string|null>} A promise that resolves with a string indicating an error message if
 * the canonical link is missing or invalid, otherwise resolves with null.
 */
function canonicalLinkRule(dom) {
  return new Promise(resolve => {
    const element = dom.querySelector(
      'head > link[rel="canonical"]'
    );
    if (!element) {
      resolve('This HTML is missing a <link rel="canonical" href="..."> link');
    }
    if (element && !element.attributes.href) {
      resolve('The canonical link is missing an href attribute');
    }
    resolve(null);
  });
}

export default canonicalLinkRule;
