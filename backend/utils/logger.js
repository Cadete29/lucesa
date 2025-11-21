/**
 * Utilidad de logging para toda la aplicación
 */
class Logger {
  constructor() {
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  info(message, ...args) {
    console.log(
      `${this.colors.cyan}[INFO]${this.colors.reset} ${this.getTimestamp()} - ${message}`,
      ...args
    );
  }

  error(message, ...args) {
    console.error(
      `${this.colors.red}[ERROR]${this.colors.reset} ${this.getTimestamp()} - ${message}`,
      ...args
    );
  }

  warn(message, ...args) {
    console.warn(
      `${this.colors.yellow}[WARN]${this.colors.reset} ${this.getTimestamp()} - ${message}`,
      ...args
    );
  }

  success(message, ...args) {
    console.log(
      `${this.colors.green}[SUCCESS]${this.colors.reset} ${this.getTimestamp()} - ${message}`,
      ...args
    );
  }

  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${this.colors.magenta}[DEBUG]${this.colors.reset} ${this.getTimestamp()} - ${message}`,
        ...args
      );
    }
  }
}

module.exports = new Logger();