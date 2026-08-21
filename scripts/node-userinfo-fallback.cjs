// The sandboxed Windows runtime can deny uv_os_get_passwd even though the
// username and home directory are available as environment variables. Keep
// tsx's temporary-directory lookup working without affecting normal machines.
const os = require('node:os');

try {
  os.userInfo();
} catch {
  os.userInfo = () => ({
    gid: -1,
    homedir: process.env.USERPROFILE || process.cwd(),
    shell: null,
    uid: -1,
    username: process.env.USERNAME || 'piggi',
  });
}
