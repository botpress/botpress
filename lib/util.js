const chalk = require('chalk');

const print = function(...args) {
  const mapping = {
    info: chalk.white,
    warn: function() { return chalk.yellow('WARN', ...arguments) },
    error: function() { return chalk.red('ERR', ...arguments) },
    success: function() { return chalk.green('OK', ...arguments) }
  };

  let level = mapping[args[0]];
  const matched = !!level;

  if(!matched) {
    level = mapping.info;
  } else {
    args.splice(0, 1);
  }

  console.log(chalk.black.bgWhite('[skin]'), '\t', level(...args));
}

module.exports = {
  print: print
};
