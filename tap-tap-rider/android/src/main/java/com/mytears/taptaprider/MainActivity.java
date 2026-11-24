package com.mytears.taptaprider;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

public final class MainActivity extends Activity {
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String ASSET_PATH = "/game/";
    private static final String GAME_URL = "https://" + ASSET_HOST + ASSET_PATH + "index.html";

    private WebView gameView;
    private RewardedAdsController rewardedAds;
    private boolean handlingBack;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        FrameLayout frame = new FrameLayout(this);
        frame.setBackgroundColor(getColor(R.color.paper));
        ViewCompat.setOnApplyWindowInsetsListener(frame, (view, windowInsets) -> {
            Insets safe = windowInsets.getInsets(WindowInsetsCompat.Type.displayCutout()
                    | WindowInsetsCompat.Type.captionBar() | WindowInsetsCompat.Type.ime());
            view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            return windowInsets;
        });

        gameView = new WebView(this);
        gameView.setBackgroundColor(getColor(R.color.paper));
        gameView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        configureGameView();
        rewardedAds = new RewardedAdsController(this);
        rewardedAds.attach(gameView);
        frame.addView(gameView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(frame);
        enterImmersiveMode();
        gameView.loadUrl(GAME_URL);
    }

    @SuppressLint("SetJavaScriptEnabled") // The WebView only loads the bundled game.
    private void configureGameView() {
        WebSettings settings = gameView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler(ASSET_PATH, new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        gameView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                return !"https".equals(url.getScheme()) || !ASSET_HOST.equals(url.getHost())
                        || url.getPath() == null || !url.getPath().startsWith(ASSET_PATH);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (!GAME_URL.equals(url)) return;
                // Android already provides immersive mode. Hide the browser fullscreen controls.
                view.evaluateJavascript("(() => { const style = document.createElement('style');"
                        + "style.textContent = '.utilities [data-action=fullscreen] {display:none}'"
                        + " + '.setting-row:has(button[data-action=fullscreen]) {display:none}';"
                        + "document.head.append(style); })()", null);
            }
        });
    }

    private void enterImmersiveMode() {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), gameView);
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && gameView != null) enterImmersiveMode();
    }

    @Override
    public void onBackPressed() {
        if (handlingBack) return;
        handlingBack = true;
        gameView.evaluateJavascript("(() => { const close = document.querySelector("
                + "'dialog[open] [data-action=close]'); if (!close) return false;"
                + "close.click(); return true; })()", closed -> {
            handlingBack = false;
            if (!"true".equals(closed) && !isFinishing() && !isDestroyed()) moveTaskToBack(true);
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        gameView.onResume();
    }

    @Override
    protected void onPause() {
        gameView.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        rewardedAds.destroy();
        ((ViewGroup) gameView.getParent()).removeView(gameView);
        gameView.destroy();
        super.onDestroy();
    }
}
