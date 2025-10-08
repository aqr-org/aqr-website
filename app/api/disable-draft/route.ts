import { draftMode, cookies } from 'next/headers';

export async function GET() {
  
  (await draftMode()).disable();
  
  const cookieStore = await cookies();
  const cookie = cookieStore.get("__prerender_bypass")!;
  (await cookies()).set({
    name: "__prerender_bypass",
    value: cookie?.value,
    expires: new Date(0), // Set expiration date to the past
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "none",
  });

  const responseHtml = `<!doctype html>
  <html>
    <head>
    <meta charset="utf-8">
    <title>Draft Mode Disabled</title></head>
    <body style="padding:3em; position:relative; font-family:system-ui,-apple-system,sans-serif;">
      <h1>Draft mode disabled</h1>
      <p>Draft mode disabled! In Storyblok editor, just refresh this preview page to view published mode.</p>
      <style>
        .refresh-indicator {
          position:fixed; 
          top: 0.5em; 
          right: 1.5em; 
          font-size:2em; 
          font-style:italic;
          color: green;
        }
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          .arrow {
            display: inline-block;
            position: relative;
            animation: bounce 1s infinite;
            font-weight:bold;
          }
      </style>
      <div class="refresh-indicator">Refresh page <span class="arrow">↑</span></div>

    </body>
  </html>`;

  return new Response(responseHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}