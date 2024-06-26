export default canonicalLinkRule;
/**
 * Checks the presence and validity of the canonical link in the provided DOM.
 * @param {import('node-html-parser').HTMLElement} dom The node-html-parser object representing the HTML document.
 * @returns {Promise<string|null>} A promise that resolves with a string indicating an error message if
 * the canonical link is missing or invalid, otherwise resolves with null.
 */
declare function canonicalLinkRule(dom: import('node-html-parser').HTMLElement): Promise<string | null>;
