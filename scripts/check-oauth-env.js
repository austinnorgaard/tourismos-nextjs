const required = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  // Apple keys are optional unless you plan to enable Apple sign in
];

const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.log('Missing OAuth environment variables:', missing.join(', '));
  process.exitCode = 2;
} else {
  console.log('All required OAuth env vars appear present');
}
