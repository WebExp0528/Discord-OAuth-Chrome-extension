$(document).ready(function () {
    $(".button-container").hide();
    $(".userinfo-container").hide();
    chrome.runtime.sendMessage({ type: "CHECK_AUTH" }, function (response) {
        if (response) {
            $(".description").text("Authenticated!");
            $(".userinfo-container").show();
            $(".button-container").hide();
            $(".userinfo-description").val(JSON.stringify(response));
        } else {
            $(".description").text("Please auth!");
            $(".button-container").show();
            $(".userinfo-container").hide();
        }
    });

    $(".btn-oauth").click(function () {
        chrome.runtime.sendMessage({ type: "CLICKED_OAUTH_BTN" }, function (response) {
            console.log(response);
        });
    });
});
