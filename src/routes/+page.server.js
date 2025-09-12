/** @type {import('./$types').PageServerLoad} */
export function load({ cookies }) {
    // サーバーサイドで、リクエストに含まれるクッキーを取得
    const accessToken = cookies.get('fitbit_access_token');

    // アクセストークンが存在するかどうかでログイン状態を判断
    const isLoggedIn = !!accessToken;

    // このオブジェクトが+page.svelteの`data`変数に渡される
    return {
        isLoggedIn: isLoggedIn
    };
}