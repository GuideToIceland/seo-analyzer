function ATagWithRelAttributeRule(dom) {
  return new Promise(resolve => {
    let count = 0;
    const elements = dom.querySelectorAll('a');
    elements.forEach(element => {
      if (!element.attributes.rel) {
        count++;
      }
    });
    if (count > 0) {
      resolve(`There are ${count} <a> tags without a rel attribute`);
    }
    resolve(null);
  });
}

export default ATagWithRelAttributeRule;
