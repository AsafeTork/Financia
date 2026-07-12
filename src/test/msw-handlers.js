import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: null, error: null });
  }),
  http.post('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: null, error: null });
  }),
  http.patch('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: null, error: null });
  }),
  http.delete('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: null, error: null });
  }),
  http.get('https://*.stripe.com/*', () => {
    return HttpResponse.json({ id: 'pi_test', client_secret: 'pi_test_secret' });
  }),
  http.post('https://*.stripe.com/*', () => {
    return HttpResponse.json({ id: 'pi_test', client_secret: 'pi_test_secret' });
  }),
];