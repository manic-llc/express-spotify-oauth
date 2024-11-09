# @wearemanic/express-spotify-oauth

 Plug and play Spotify OAUTH flow for Express.

## Installation

```zsh
npm install --save @wearemanic/express-spotify-oauth
```

## Usage

```javascript
import express from 'express';
import SpotifyOauth from '@wearemanic/express-spotify-oauth'

const app = express()

SpotifyOauth(app, {
  baseUrl: '/api/spotify',
  redirectUrl: '/api/spotify/callback',
  targetUrl: '/',
  clientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  clientSecret: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
})

app.listen(3000)
```