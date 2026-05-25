export const linux = new Set([
  '/etc', '/proc', '/sys', '/dev', '/boot',
  '/bin', '/sbin', '/lib', '/lib64', '/usr',
  '/var', '/opt', '/root',
])
export const windows = new Set([
  'C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)',
  'C:\\System32', 'C:\\Boot', 'C:\\Recovery',
])
export const macOs = new Set([
  '/System', '/Library', '/private', '/cores', '/Volumes',
])