import { google } from 'googleapis';
import axios from 'axios';
import dotenv from 'dotenv';
import { log } from 'console';
dotenv.config();

//parameters for Google OAuth2 from environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// function to generate the authentication URL for Google OAuth2
//function to replace the code with the tokens received from Google
export async function getTokens(code: string) {



  console.log('Authorization code received:', code);

  const { tokens } = await oauth2Client.getToken(code);
  console.log('Granted scopes:', tokens.scope);

  try {
    const tokenInfo = await axios.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${tokens.access_token}`);
    console.log('Token info from Google:', tokenInfo.data);
    console.log('Granted scopes from tokens object:', tokens.scope ?? 'No scope info in tokens object');

  } catch (e) {
    console.error('Error fetching token info:', e);
  }

  oauth2Client.setCredentials(tokens);
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token, // חשוב - שומר אותו אם גוגל החזירה
    id_token: tokens.id_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
      : 8 * 60 * 60, //  Default to 8 hours
    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}
export async function getGoogleWithoutCode(idToken: string) {
  const ticket = await oauth2Client.verifyIdToken({
    idToken,
    audience: CLIENT_ID,
  });

  return ticket.getPayload();
}
// function to get the user's Google profile information
export async function getGoogleUserInfo(access_token: string) {
  const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (response.status !== 200) throw new Error('Failed to fetch user info');

  return response.data;
}


export async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams();
  params.append('client_id', process.env.GOOGLE_CLIENT_ID!);
  params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET!);
  params.append('refresh_token', refreshToken);
  params.append('grant_type', 'refresh_token');

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    return {
      access_token,
      expires_at: expiresAt,
    };
  } catch (error: any) {
    console.error('error in getting new token from google: ', error.response?.data || error.message);
    console.error('Using refresh_token:', refreshToken);

    throw new Error('RefreshTokenError');
  }
}