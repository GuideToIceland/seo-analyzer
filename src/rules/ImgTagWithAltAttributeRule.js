function imgTagWithAltAttributeRule(dom) {
  return new Promise(resolve => {
    let countAlt = 0;
    let countSrc = 0;
    const report = [];
    const elements = dom.querySelectorAll('img');

    elements.forEach(element => {
      if (!element.attributes.alt) {
        countAlt++;
      }
      if (!element.attributes.src) {
        countSrc++;
      }
    });

    if (countSrc > 0) {
      report.push(`There are ${countSrc} <img> tags without a src attribute`);
    }

    if (countAlt > 0) {
      report.push(`There are ${countAlt} <img> tags without an alt attribute`);
    }

    if (countSrc || countAlt) {
      resolve(report);
    }

    resolve(null);
  });
}

export default imgTagWithAltAttributeRule;
