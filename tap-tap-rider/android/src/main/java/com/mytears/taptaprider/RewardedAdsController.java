package com.mytears.taptaprider;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;

import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Collections;

/** A rewarded-ad bridge restricted to the bundled game's main frame. */
final class RewardedAdsController {
    private static final String GAME_ORIGIN = "https://appassets.androidplatform.net";
    // Official Google demo unit. It does not generate publisher revenue.
    private static final String AD_UNIT = "ca-app-pub-3940256099942544/5224354917";
    private final Activity activity;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Request active;
    private boolean initialized;
    private boolean destroyed;

    private static final class Request {
        final String id;
        final JavaScriptReplyProxy reply;
        Runnable timeout;
        boolean earned;
        boolean showing;

        Request(String id, JavaScriptReplyProxy reply) {
            this.id = id;
            this.reply = reply;
        }
    }

    RewardedAdsController(Activity activity) {
        this.activity = activity;
    }

    void attach(WebView game) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        WebViewCompat.addWebMessageListener(game, "RiderNativeAds", Collections.singleton(GAME_ORIGIN),
                (view, message, origin, mainFrame, reply) -> {
                    if (!mainFrame || destroyed || !"https".equals(origin.getScheme())
                            || !"appassets.androidplatform.net".equals(origin.getHost())
                            || (origin.getPort() != -1 && origin.getPort() != 443)) return;
                    try {
                        JSONObject input = new JSONObject(message.getData());
                        String id = input.optString("id");
                        if (id.isEmpty() || id.length() > 80) return;
                        if ("cancel".equals(input.optString("action"))) {
                            if (active != null && active.id.equals(id) && !active.showing) {
                                finish(active, "cancelled", "광고 시청이 취소됐어요.");
                            }
                        } else if ("show".equals(input.optString("action"))) {
                            show(new Request(id, reply));
                        }
                    } catch (JSONException | IllegalStateException ignored) {
                        // Discard malformed messages or replies from a destroyed page.
                    }
                });
    }

    private void show(Request request) {
        if (active != null) {
            send(request, "error", "다른 광고가 진행 중이에요.");
            return;
        }
        active = request;
        request.timeout = () -> finish(request, "error", "광고를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.");
        handler.postDelayed(request.timeout, 30000);
        if (initialized) {
            load(request);
        } else {
            new Thread(() -> MobileAds.initialize(activity.getApplicationContext(), status ->
                    activity.runOnUiThread(() -> {
                        initialized = true;
                        load(request);
                    })), "rewarded-ads-init").start();
        }
    }

    private void load(Request request) {
        if (active != request || destroyed || activity.isFinishing()) return;
        RewardedAd.load(activity, AD_UNIT, new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
            @Override
            public void onAdFailedToLoad(LoadAdError error) {
                finish(request, "error", "광고를 준비하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
            }

            @Override
            public void onAdLoaded(RewardedAd ad) {
                if (active != request || destroyed) return;
                if (activity.isFinishing() || activity.isDestroyed() || !activity.hasWindowFocus()) {
                    finish(request, "error", "게임 화면으로 돌아온 뒤 다시 시도해 주세요.");
                    return;
                }
                handler.removeCallbacks(request.timeout);
                ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdShowedFullScreenContent() {
                        request.showing = true;
                        send(request, "showing", "");
                    }

                    @Override
                    public void onAdDismissedFullScreenContent() {
                        finish(request, request.earned ? "earned" : "cancelled",
                                request.earned ? "" : "시청을 완료하면 특별 콜을 해금할 수 있어요.");
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(AdError error) {
                        finish(request, "error", "광고를 표시하지 못했어요. 다시 시도해 주세요.");
                    }
                });
                ad.show(activity, reward -> request.earned = true);
            }
        });
    }

    private void finish(Request request, String status, String message) {
        if (active != request) return;
        handler.removeCallbacks(request.timeout);
        active = null;
        send(request, status, message);
    }

    private void send(Request request, String status, String message) {
        if (destroyed || !WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        try {
            JSONObject result = new JSONObject();
            result.put("id", request.id);
            result.put("status", status);
            result.put("message", message);
            request.reply.postMessage(result.toString());
        } catch (JSONException | IllegalStateException ignored) {
            // A navigation may invalidate the reply proxy while the native ad is open.
        }
    }

    void destroy() {
        destroyed = true;
        if (active != null) handler.removeCallbacks(active.timeout);
        active = null;
    }
}
