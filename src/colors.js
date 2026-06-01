const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
};

export const cyan = (s) => `${c.cyan}${s}${c.reset}`;
export const boldCyan = (s) => `${c.bold}${c.cyan}${s}${c.reset}`;
export const dim = (s) => `${c.dim}${s}${c.reset}`;
export const green = (s) => `${c.green}${s}${c.reset}`;
export const red = (s) => `${c.red}${s}${c.reset}`;
export const boldRed = (s) => `${c.bold}${c.red}${s}${c.reset}`;
