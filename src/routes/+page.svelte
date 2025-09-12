<script>
    import { onMount } from 'svelte';
    // import { FITBIT_CLIENT_ID, FITBIT_REDIRECT_URI, FITBIT_SCOPE } from '$lib/fitbitConfig';
    
    // let accessToken = null;
    export let data;
    let heartRate = '...';
    let heartRateTimestamp = '';
    let intervalId = null;

    // 暗号学的に安全なランダム文字列を生成する関数
    // function generateRandomString(length) {
    //     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    //     let result = '';
    //     const charactersLength = characters.length;
    //     for (let i = 0; i < length; i++) {
    //         result += characters.charAt(Math.floor(Math.random() * charactersLength));
    //     }
    //     return result;
    // }
    
    // PKCE用のコードを生成する非同期関数
    // async function generateCodeChallenge(verifier) {
    //     const encoder = new TextEncoder();
    //     const data = encoder.encode(verifier);
    //     const digest = await window.crypto.subtle.digest('SHA-256', data);
    //     return btoa(String.fromCharCode(...new Uint8Array(digest)))
    //     .replace(/\+/g, '-')
    //     .replace(/\//g, '_')
    //     .replace(/=/g, '');
    // }

    // Fitbitの認証ページへリダイレクトする関数
    // async function redirectToFitbit() {
    //     // 1. 【修正点】仕様を満たす十分な長さの合言葉 (code_verifier) を生成
    //     const verifier = generateRandomString(128); // 43〜128文字の範囲で生成
        
    //     // 2. 錠前 (code_challenge) を生成
    //     const challenge = await generateCodeChallenge(verifier);

    //     // 3. 合言葉をブラウザに一時保存（後で使うため）
    //     sessionStorage.setItem('fitbit_code_verifier', verifier);

    //     // 4. Fitbit認証ページのURLを組み立てる
    //     const authUrl = new URL('https://www.fitbit.com/oauth2/authorize');
    //     authUrl.searchParams.append('client_id', FITBIT_CLIENT_ID);
    //     authUrl.searchParams.append('response_type', 'code');
    //     authUrl.searchParams.append('scope', FITBIT_SCOPE);
    //     authUrl.searchParams.append('redirect_uri', FITBIT_REDIRECT_URI);
    //     authUrl.searchParams.append('code_challenge', challenge);
    //     authUrl.searchParams.append('code_challenge_method', 'S256');

    //     // 5. ユーザーをFitbitのページへリダイレクト
    //     window.location.href = authUrl.toString();
    // }

    // ログイン状態をチェックし、ログイン済みなら心拍数を取得
    // onMount(() => {
    //     const token = localStorage.getItem('fitbit_access_token');
    //     if (token) {
    //     accessToken = token;
    //     fetchHeartRate();
    //     }
    // });

    // 心拍数を取得する関数
    async function fetchHeartRate() {
        // ユーザーがログインしていない場合は何もしない
        if (!data.isLoggedIn) return;

        console.log('心拍数データを取得中...'); // デバッグ用ログ

        // 自作サーバーのエンドポイントにリクエスト
        try{
            const response = await fetch('/api/heartrate'); 
            if (response.ok) {
                const result = await response.json();
                heartRate = result.value;
                heartRateTimestamp = result.time;
            } else {
                heartRate = '取得失敗';
            }
        // console.log('APIリクエスト直前のアクセストークン:', accessToken);   //debug

        // if (!accessToken) return;

        // Fitbit APIのエンドポイント (今日の心拍数を1分間隔で取得)
        // const url = 'https://api.fitbit.com/1/user/-/activities/heart/date/today/1d/1min.json';

        // try {
        //     const response = await fetch(url, {
        //         headers: {
        //         //【重要】ここでアクセストークンを提示する
        //         'Authorization': `Bearer ${accessToken}`,
        //         },
        //     });

        //     // if (!response.ok) {
        //     //     // トークンの有効期限切れなどの場合
        //     //     if(response.status === 401) {
        //     //         alert('セッションが切れました。再度ログインしてください。');
        //     //         logout();
        //     //     }
        //     //     throw new Error('心拍データの取得に失敗しました。');
        //     // }

        //     if (!response.ok) {
        //         // エラーレスポンスの本体をJSONとして読み取る
        //         const errorData = await response.json();
                
        //         // ステータスコードと、Fitbitからの詳細なエラーメッセージをコンソールに出力
        //         console.error(`API Error Status: ${response.status}`);
        //         console.error('Fitbitからの詳細エラー:', errorData);
                
        //         // エラーを投げてcatchブロックに処理を移す
        //         throw new Error(`Fitbit APIエラー (Status: ${response.status})`);
        //     }


        //     const data = await response.json();
        //     const heartRateSeries = data['activities-heart-intraday'].dataset;
            
        //     // 最新の心拍数を取得
        //     if (heartRateSeries.length > 0) {
        //         heartRate = heartRateSeries[heartRateSeries.length - 1].value;
        //     } else {
        //         heartRate = 'データなし';
        //     }

        } catch (error) {
            console.error(error);
            heartRate = '取得失敗';
        }
    }

    // ページが表示された時に心拍数を取得
    onMount(() => {
        // ログインしている場合のみ処理を開始
        if (data.isLoggedIn) {
            // 1. まずページ表示直後に一度データを取得
            fetchHeartRate();

            // 2. その後、5秒ごと（5000ミリ秒）にfetchHeartRateを繰り返し実行
            //    短い間隔でアクセスしすぎるとAPI制限に掛かる可能性があるので注意
            intervalId = setInterval(fetchHeartRate, 30000);
        }

        // 3. ユーザーが別のページに移動するなど、このコンポーネントが不要になった際に実行される
        //    これにより、バックグラウンドで不要な通信が走り続けるのを防ぐ
        return () => {
            if (intervalId) {
                console.log('心拍数の定期取得を停止します。');
                clearInterval(intervalId);
            }
        };
    });
  
    // // PKCE用のコードを生成する非同期関数
    // async function generateCodeChallenge(verifier) {
    //   const encoder = new TextEncoder();
    //   const data = encoder.encode(verifier);
    //   const digest = await window.crypto.subtle.digest('SHA-256', data);
    //   return btoa(String.fromCharCode(...new Uint8Array(digest)))
    //     .replace(/\+/g, '-')
    //     .replace(/\//g, '_')
    //     .replace(/=/g, '');
    // }
  
    // // Fitbitの認証ページへリダイレクトする関数
    // async function redirectToFitbit() {
    //   // 1. 合言葉 (code_verifier) を生成
    //   const verifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
    //   // 2. 錠前 (code_challenge) を生成
    //   const challenge = await generateCodeChallenge(verifier);
  
    //   // 3. 合言葉をブラウザに一時保存（後で使うため）
    //   sessionStorage.setItem('fitbit_code_verifier', verifier);
  
    //   // 4. Fitbit認証ページのURLを組み立てる
    //   const authUrl = new URL('https://www.fitbit.com/oauth2/authorize');
    //   authUrl.searchParams.append('client_id', FITBIT_CLIENT_ID);
    //   authUrl.searchParams.append('response_type', 'code');
    //   authUrl.searchParams.append('scope', FITBIT_SCOPE);
    //   authUrl.searchParams.append('redirect_uri', FITBIT_REDIRECT_URI);
    //   authUrl.searchParams.append('code_challenge', challenge);
    //   authUrl.searchParams.append('code_challenge_method', 'S256');
  
    //   // 5. ユーザーをFitbitのページへリダイレクト
    //   window.location.href = authUrl.toString();
    // }
  </script>
  
  <main>
    <h1>Fitbit 心拍数ビューア</h1>
  
    {#if data.isLoggedIn}
      <div>
        <h2>現在の心拍数</h2>
        <p>{heartRateTimestamp} 現在</p>
        <p style="font-size: 3em;">{heartRate} bpm</p>
        <button on:click={fetchHeartRate}>更新</button>
        <!-- <button on:click={logout}>ログアウト</button> -->
      </div>
    {:else}
      <!-- <button on:click={redirectToFitbit}>Fitbitでログイン</button> -->
      <a href="/login">Fitbitでログイン</a>
    {/if}
  </main>