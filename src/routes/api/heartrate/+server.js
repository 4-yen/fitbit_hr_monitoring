import { json, error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ cookies }) {
    // 1. ブラウザから送られてきたクッキーからアクセストークンを取得
    const accessToken = cookies.get('fitbit_access_token');

    // 2. トークンがなければ、未認証エラーを返す
    if (!accessToken) {
        throw error(401, 'Not authenticated'); // 401 Unauthorized
    }

    // 3. サーバーからFitbit APIにデータをリクエスト
    const fitbitApiUrl = 'https://api.fitbit.com/1/user/-/activities/heart/date/today/1d/1min.json';

    const fitbitResponse = await fetch(fitbitApiUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    // Fitbit APIからのレスポンスがエラーだった場合の処理
    if (!fitbitResponse.ok) {
        console.error('Fitbit API error:', await fitbitResponse.text());
        throw error(fitbitResponse.status, 'Failed to fetch data from Fitbit');
    }

    // 4. FitbitからのデータをJSONとして解析
    const fitbitData = await fitbitResponse.json();

    // 【デバッグ用に追加】Fitbitから返ってきた生のデータを確認する
    console.log('Fitbitからのレスポンス:', JSON.stringify(fitbitData, null, 2));

    // 5. 必要なデータを抽出してクライアントに返す
    try {
        const heartRateSeries = fitbitData['activities-heart-intraday'].dataset;
        let latestDataPoint = 'データなし';
        
        if (heartRateSeries.length > 0) {
            latestDataPoint = heartRateSeries[heartRateSeries.length - 1];
        }
        
        // SvelteKitのjsonヘルパーを使って、適切なヘッダー付きでレスポンスを返す
        return json({ value: latestDataPoint.value, time: latestDataPoint.time });

    } catch (e) {
        console.error('Error processing Fitbit data:', e);
        throw error(500, 'Internal Server Error'); // 500 Internal Server Error
    }
}