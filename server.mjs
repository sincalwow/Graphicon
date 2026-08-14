import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = Number.parseInt(process.env.PORT || '4173', 10);
const AI_API_BASE = (process.env.AI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
const AI_MODEL = process.env.AI_MODEL || 'gpt-4.1-mini';
const MAX_PROMPT_LENGTH = 800;
const ROOT = process.cwd();

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function send(response, status, body, type = 'application/json; charset=utf-8') {
  response.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(Buffer.isBuffer(body) || typeof body === 'string' ? body : JSON.stringify(body));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) throw new Error('请求内容过大');
  }
  return body ? JSON.parse(body) : {};
}

function extractSvg(content) {
  const start = content.indexOf('<svg');
  const end = content.lastIndexOf('</svg>');
  if (start < 0 || end < start) return null;
  const svg = content.slice(start, end + 6)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  return svg.length <= 250_000 ? svg : null;
}

async function generateSvg(prompt) {
  if (!process.env.AI_API_KEY) {
    const error = new Error('未配置 AI_API_KEY。请在服务器环境中设置 API 密钥后重试。');
    error.status = 503;
    throw error;
  }
  const upstream = await fetch(`${AI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.45,
      max_tokens: 1800,
      messages: [
        {
          role: 'system',
          content: 'You create clean, self-contained SVG illustrations for a professional vector editor. Return ONLY one valid <svg> document. Do not include markdown, scripts, external images, fonts, links, animation, or event handlers. Use viewBox, paths, shapes, groups, fills, strokes, and simple gradients only. Keep the design editable and under 200KB.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = new Error(data?.error?.message || `AI 服务返回 ${upstream.status}`);
    error.status = upstream.status;
    throw error;
  }
  const content = data?.choices?.[0]?.message?.content || '';
  const svg = extractSvg(content);
  if (!svg) {
    const error = new Error('AI 未返回可安全导入的 SVG');
    error.status = 422;
    throw error;
  }
  return svg;
}

async function serveStatic(pathname, response) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const safePath = normalize(requested).replace(/^([.][.][/\\])+/, '');
  const filePath = join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) return send(response, 403, { error: '禁止访问该路径' });
  try {
    const content = await readFile(filePath);
    send(response, 200, content, contentTypes[extname(filePath)] || 'application/octet-stream');
  } catch {
    send(response, 404, { error: '未找到资源' });
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'POST' && url.pathname === '/api/ai/generate-svg') {
    try {
      const body = await readJson(request);
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
      if (prompt.length < 3 || prompt.length > MAX_PROMPT_LENGTH) {
        return send(response, 400, { error: `提示词长度需在 3–${MAX_PROMPT_LENGTH} 个字符之间` });
      }
      const svg = await generateSvg(prompt);
      return send(response, 200, { svg });
    } catch (error) {
      return send(response, error.status || 500, { error: error.message || 'AI 服务异常' });
    }
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return send(response, 405, { error: '不支持的请求方法' });
  return serveStatic(decodeURIComponent(url.pathname), response);
}).listen(PORT, () => {
  console.log(`Graphicon 正在运行：http://localhost:${PORT}`);
  console.log(`AI 模型：${AI_MODEL}；AI 服务：${process.env.AI_API_KEY ? '已配置' : '未配置'}`);
});
