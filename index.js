import qs from 'query-string';

export default (app, config = {}) => {
  const SPOTIFY_ROOT = `https://accounts.spotify.com`;
  const STATE_KEY_COOKIE = 'express-spotify-oauth-state';
  const { clientId, clientSecret, redirectUrl, baseUrl, targetUrl, scopes } = {
    scopes: ['user-read-playback-state', 'user-read-private', 'user-read-email'],
    baseUrl: '/api/spotify',
    targetUrl: '/',
    ...config,
  };

  const authHeaders = () => ({
    Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    'Content-Type': 'application/x-www-form-urlencoded',
  });

  function initializeOauthFlow(req, res) {
    try {
      const state = Math.random().toString(36).slice(5, 11).toUpperCase();
      const query = qs.stringify({
        response_type: 'code',
        scope: scopes.join(' '),
        state,
        client_id: clientId,
        redirect_uri: redirectUrl,
      });

      res.cookie(STATE_KEY_COOKIE, state);
      res.redirect(`https://accounts.spotify.com/authorize?${query}`);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error });
    }
  }

  async function handleOauthCallback(req, res) {
    try {
      if (!req.query.code) throw new Error('No code present.');

      const response = await fetch(`${SPOTIFY_ROOT}/api/token`, {
        method: 'POST',
        headers: authHeaders(),
        body: new URLSearchParams({
          code: req.query.code,
          redirect_uri: redirectUrl,
          grant_type: 'authorization_code',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error('Spotify login unsuccessful.');
      const { access_token, refresh_token } = data;
      res.cookie('spotify-access-token', access_token);
      res.cookie('spotify-refresh-token', refresh_token);
      res.redirect(`${targetUrl}`);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error });
    }
  }

  async function handleRefresh(req, res) {
    try {
      const {
        body: { token },
      } = req;

      if (!token) throw new Error(`No token provided.`);

      const response = await fetch(`${SPOTIFY_ROOT}/api/token`, {
        method: 'POST',
        headers: authHeaders(),
        body: new URLSearchParams({
          refresh_token: token,
          grant_type: 'refresh_token',
        }),
      });

      const body = await response.json();

      if (!response.ok || !body.access_token) throw new Error(`Spotify token refresh unsuccessful.`);

      res.status(200).send({ accessToken: body.access_token });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error });
    }
  }

  app.get(`${baseUrl}/login`, initializeOauthFlow);
  app.get(`${baseUrl}/callback`, handleOauthCallback);
  app.post(`${baseUrl}/refresh`, handleRefresh);
};
