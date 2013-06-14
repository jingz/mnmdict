chrome.runtime.onMessageExternal.addListener(
    function(req, res, sendResponse) {
        sendResponse({ result: "OK, I got it"});
    }
);

// init database here

var window_popup = chrome.extension.getViews({ type: "popup" });
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    console.log('bg', window)
    console.log(window_popup)
    window_popup[0].log_word_history_from_background(req, sender, sendResponse);
});
