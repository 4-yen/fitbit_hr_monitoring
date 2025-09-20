<script>
    import { onMount } from 'svelte';

    export let data;
    let heartRate = '...';
    let heartRateTimestamp = '';
    let intervalId = null;

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