import { http, HttpResponse } from 'msw';

export const aiHandlers = [
  // 正常レスポンス
  http.post('/api/generate', () => {
    return HttpResponse.json({
      content: 'テスト用AI生成コンテンツです。これはモックレスポンスです。',
    });
  }),

  // 429 レート制限
  http.post('/api/generate/rate-limited', () => {
    return new HttpResponse(null, {
      status: 429,
      headers: { 'retry-after': '60' },
    });
  }),

  // 500 サーバーエラー
  http.post('/api/generate/error', () => {
    return new HttpResponse(null, { status: 500 });
  }),
];
