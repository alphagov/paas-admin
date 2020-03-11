module.exports = {
  process(src) {
    return `const peg = require("pegjs");module.exports = peg.generate(${JSON.stringify(src)});`;
  },
};
