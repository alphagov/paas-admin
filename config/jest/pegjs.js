module.exports = {
  process(src) {
    return {
      code: `const peg = require("pegjs");module.exports = peg.generate(${JSON.stringify(src)});`,
    };
  },
};
