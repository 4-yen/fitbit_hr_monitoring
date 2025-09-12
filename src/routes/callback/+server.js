import { redirect } from '@sveltejs/kit';
// `$lib`からではなく、`$env/static/private`からインポートする
import { FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET } from '$env/static/private'; 
import { FITBIT_REDIRECT_URI } from '$lib/fitbitConfig'; // REDIRECT_URIは秘密情報ではないので$libでもOK

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, cookies }) {
    // 1. URLから認証コードを取得
    const code = url.searchParams.get('code');
    
    // 2. ログイン処理時に保存したcode_verifierをクッキーから取得
    const verifier = cookies.get('fitbit_code_verifier');

    if (!code || !verifier) {
        // 必要な情報がない場合はエラーとしてトップにリダイレクト
        throw redirect(302, '/?error=auth_failed');
    }

    // 3. 【重要】Authorizationヘッダーを作成
    // "CLIENT_ID:CLIENT_SECRET"という文字列をBase64エンコードする
    // const basicAuth = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64');
    const basicAuth = btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`);

    try {
        // 4. FitbitのトークンエンドポイントにPOSTリクエストを送信
        const response = await fetch('https://api.fitbit.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: FITBIT_CLIENT_ID,
                grant_type: 'authorization_code',
                redirect_uri: FITBIT_REDIRECT_URI,
                code: code,
                code_verifier: verifier,
            }),
        });
        
        const data = await response.json();

        if (!response.ok) {
            // エラーの場合は内容をログに出力
            console.error('Fitbit token exchange error:', data);
            throw new Error('Failed to exchange token');
        }

        // 5. 取得したトークンを安全なHTTP-Onlyクッキーに保存
        cookies.set('fitbit_access_token', data.access_token, {
            path: '/',
            httpOnly: true,
            secure: true, // 本番環境では必須
            maxAge: data.expires_in, // トークンの有効期限
        });
        
        cookies.set('fitbit_refresh_token', data.refresh_token, {
            path: '/',
            httpOnly: true,
            secure: true,
        });

    } catch (error) {
        console.error(error);
        throw redirect(302, '/?error=token_exchange_failed');
    }
    
    // 6. 認証が完了したので、不要になったverifierのクッキーを削除
    cookies.delete('fitbit_code_verifier', { path: '/' });

    // 7. ユーザーをトップページ（またはダッシュボード）にリダイレクト
    throw redirect(302, '/');
}