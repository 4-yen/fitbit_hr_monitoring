import { redirect } from '@sveltejs/kit';
import { FITBIT_CLIENT_ID, FITBIT_REDIRECT_URI, FITBIT_SCOPE } from '$env/static/private';
import crypto from 'crypto';

function generateRandomString() {
    return crypto.randomBytes(80).toString('base64url');
}

function generateCodeChallenge(verifier) {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

export async function GET({ cookies }) {
    const verifier = generateRandomString();
    const challenge = await generateCodeChallenge(verifier);

    // VerifierをHTTP-Onlyクッキーに保存
    cookies.set('fitbit_code_verifier', verifier, {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 60 * 10 // 10分間有効
    });

    const authUrl = new URL('https://www.fitbit.com/oauth2/authorize');
    authUrl.searchParams.append('client_id', FITBIT_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', FITBIT_SCOPE);
    authUrl.searchParams.append('redirect_uri', FITBIT_REDIRECT_URI);
    authUrl.searchParams.append('code_challenge', challenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // SvelteKitのredirect機能を使ってユーザーをリダイレクト
    throw redirect(302, authUrl.toString());
}