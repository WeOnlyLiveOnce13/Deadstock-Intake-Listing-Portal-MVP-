// Production environment
// For Docker: API is proxied through nginx at /api
// For Vercel/Netlify: Set API_URL environment variable in dashboard
export const environment = {
  production: true,
  // Docker uses /api proxy, standalone uses full URL
  // apiUrl: '/api', ----> for local
  apiUrl: 'https://deadstock-intake-listing-portal-mvp-production.up.railway.app'
};
