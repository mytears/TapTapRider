(() => {
  "use strict";
  const android = location.hostname === "appassets.androidplatform.net";
  let pending = null;

  function finish(result) {
    if (!pending) return;
    const request = pending;
    pending = null;
    clearInterval(request.timer);
    clearTimeout(request.timeout);
    request.resolve(result);
  }

  if (window.RiderNativeAds) {
    window.RiderNativeAds.onmessage = event => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (!pending || message.id !== pending.id) return;
      if (message.status === "showing") {
        clearTimeout(pending.timeout);
        pending.onStatus("광고를 시청하면 특별 콜이 해금돼요.");
        return;
      }
      finish({earned: message.status === "earned", message: message.message || ""});
    };
  }

  function request(onStatus) {
    if (pending) return Promise.resolve({earned: false, message: "광고가 진행 중이에요."});
    return new Promise(resolve => {
      const id = String(Date.now()) + "-" + Math.random().toString(36).slice(2);
      pending = {id, resolve, onStatus};
      if (android) {
        if (!window.RiderNativeAds) {
          finish({earned: false, message: "광고 기능을 사용할 수 없어요. 최신 테스트 APK로 업데이트해 주세요."});
          return;
        }
        onStatus("광고를 불러오고 있어요…");
        pending.timeout = setTimeout(() => {
          window.RiderNativeAds.postMessage(JSON.stringify({action: "cancel", id}));
          finish({earned: false, message: "광고를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요."});
        }, 35000);
        try { window.RiderNativeAds.postMessage(JSON.stringify({action: "show", id})); }
        catch { finish({earned: false, message: "광고 연결에 실패했어요. 다시 시도해 주세요."}); }
        return;
      }

      // Browser previews explicitly simulate the rewarded-ad lifecycle.
      let remaining = 5;
      let last = performance.now();
      onStatus("보상 광고 테스트 · 5초 남음");
      pending.timer = setInterval(() => {
        const now = performance.now();
        if (!document.hidden) remaining -= Math.min((now - last) / 1000, 0.3);
        last = now;
        onStatus("보상 광고 테스트 · " + Math.max(0, Math.ceil(remaining)) + "초 남음");
        if (remaining <= 0) finish({earned: true});
      }, 200);
    });
  }

  function cancel() {
    if (pending && android && window.RiderNativeAds) {
      window.RiderNativeAds.postMessage(JSON.stringify({action: "cancel", id: pending.id}));
    }
    finish({earned: false, message: "시청을 마치면 특별 콜을 해금할 수 있어요."});
  }

  window.RiderAds = {android, request, cancel};
})();
