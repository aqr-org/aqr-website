# Testing Netlify Functions Locally

## Quick Start

1. **IMPORTANT**: You MUST use `netlify dev` (NOT `npm run dev`) to test functions:
   ```bash
   netlify dev
   ```
   Keep this terminal running. 

   **What you should see:**
   - Next.js dev server starting on port 3001 (or your configured port)
   - Functions server starting (may be on port 8888 or proxied through the main port)
   - Look for messages like: `▶  Functions server is listening on...` or `▶  Netlify Dev server listening on...`

   **Note**: If you're already running `npm run dev`, stop it and use `netlify dev` instead. The Functions server won't work with `npm run dev`.

2. **Test the function** - Try one of these methods:

   **Method A: Using netlify CLI** (in a new terminal):
   ```bash
   netlify functions:invoke sync-beacon-status --port 3001
   ```
   (If port 8888 doesn't work, try with --port 3001)

   **Method B: Using HTTP request** (recommended):
   ```bash
   curl http://localhost:3001/.netlify/functions/sync-beacon-status
   ```
   
   Or if using HTTPS:
   ```bash
   curl https://localhost:3001/.netlify/functions/sync-beacon-status -k
   ```

   **Method C: In your browser**:
   ```
   http://localhost:3001/.netlify/functions/sync-beacon-status
   ```
   or
   ```
   https://localhost:3001/.netlify/functions/sync-beacon-status
   ```

## Common Issues

### Error: EACCES: permission denied, open .../netlify/deno-cli/deno-cli-latest.zip

This is a permission issue with Edge Functions setup, but it **doesn't affect regular serverless functions**. If you see:
- `⬥ Loaded function sync-beacon-status` - Your function is working!
- The error can be safely ignored for serverless functions
- To fix (optional): `sudo chown -R $(whoami) ~/Library/Preferences/netlify/`

### Error: "request to http://localhost:8888/.netlify/functions/sync-beacon-status failed"

**Solution 1**: Make sure you're running `netlify dev` (NOT `npm run dev`). Stop any `npm run dev` process and start:
```bash
netlify dev
```

**Solution 2**: If `netlify dev` is running but on a different port, specify the port:
```bash
netlify functions:invoke sync-beacon-status --port 3001
```

**Solution 3**: Test via HTTP directly instead:
```bash
curl http://localhost:3001/.netlify/functions/sync-beacon-status
```

### Error: Missing environment variables

**Solution**: Create a `.env` file in the project root:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
BEACON_AUTH_TOKEN=your-beacon-token
BEACON_API_URL=https://api.beaconcrm.org/v1/account/30435
```

### Error: TypeScript compilation errors

**Solution**: Ensure all dependencies are installed:
```bash
npm install
```

If TypeScript errors persist, you may need to compile manually or check that `netlify dev` is using the correct TypeScript configuration.

## Testing Scheduled Functions Locally

Scheduled functions (`@daily`, `@hourly`, etc.) can't be triggered automatically during local testing. To test:

1. Start `netlify dev`
2. Manually invoke the function using the methods above
3. Or modify the schedule temporarily to `@every 1m` for testing (remember to change back!)

## Debugging

Add console.log statements in your function to see output in the terminal where `netlify dev` is running.

Example:
```typescript
console.log('Function started');
console.log('Environment:', process.env.BEACON_API_URL);
```

