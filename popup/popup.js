$(document).ready(function () {
  $('.btn-oauth').click(function () {
    chrome.runtime.sendMessage({ type: 'CLICKED_OAUTH_BTN' }, function (response) {
      console.log(response);
    });
  });
});
