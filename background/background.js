const CLIENT_ID = "712931319998447636";
const CLIENT_SECRET = "KZNL_IB2evwN2nqGU_L1uJKXvcGrDqGt";
const REDIRECT_URI = "https://discord.com";

const CURRENT_USER_API = "/users/@me";

var g_opendTab;
var g_authorizationCode = "";
var g_tokens;

/**
 * Tabs update listener
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    var url = changeInfo.url;

    if (url && url.includes(REDIRECT_URI + "/?code")) {
        var params = getParams(url);
        g_authorizationCode = params.code;

        //Get tokens from authorization code
        getTokensFromCode(g_authorizationCode, "authorization_code").then((token) => {
            g_tokens = token;
            chrome.tabs.remove(tabId);
        });
    }
});

/**
 * Message Listener
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "CLICKED_OAUTH_BTN": {
            // Open oauth tab
            openNewTab(
                "https://discord.com/oauth2/authorize?client_id=" +
                    CLIENT_ID +
                    "&redirect_uri=" +
                    encodeURIComponent(REDIRECT_URI) +
                    "&response_type=code&scope=identify"
            );
            sendResponse(true);
            break;
        }
        case "CHECK_AUTH": {
            if (g_tokens && g_tokens.refresh_token) {
                // refresh tokens
                getAccessToken(g_tokens.refresh_token)
                    .then((token) => {
                        g_tokens = token;

                        //Userinfo from discord API
                        apiCall(CURRENT_USER_API, "GET", g_tokens)
                            .then(function (data) {
                                sendResponse(data);
                            })
                            .catch(function (err) {
                                console.log("~~~~~~~~~ error in getting userinfo", err);
                                sendResponse(false);
                            });
                    })
                    .catch((err) => {
                        console.log("~~~~~~~~~~~~ error in refreshing token ", err);
                        sendResponse(false);
                    });
            } else {
                sendResponse(false);
            }
            break;
        }
    }
    return true;
});

/**
 * Open new tab by url
 * @param {string} url
 */
const openNewTab = (url) => {
    chrome.tabs.query({ url: url }, (tabs) => {
        if (tabs.length) {
            chrome.tabs.update(tabs[0].id, { active: true });
        } else {
            chrome.tabs.create({ url: url }, function (tab) {
                g_opendTab = tab;
            });
        }
    });
};

/**
 * Get tokens from authorization code
 * @param {string} code
 */
const getTokensFromCode = (code) => {
    return new Promise((resolve, reject) => {
        fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            body:
                "grant_type=authorization_code&client_id=" +
                CLIENT_ID +
                "&client_secret=" +
                CLIENT_SECRET +
                "&code=" +
                code +
                "&redirect_uri=" +
                encodeURIComponent(REDIRECT_URI),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })
            .then((resp) => {
                return resp.json();
            })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

/**
 * Refresh tokens from refresh_token
 * @param {string} refresh_token
 */
const getAccessToken = (refresh_token) => {
    return new Promise((resolve, reject) => {
        fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            body:
                "grant_type=refresh_token&client_id=" +
                CLIENT_ID +
                "&client_secret=" +
                CLIENT_SECRET +
                "&redirect_uri=" +
                encodeURIComponent(REDIRECT_URI) +
                "&refresh_token=" +
                refresh_token,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })
            .then((resp) => {
                return resp.json();
            })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

/**
 * Make api call from access_token
 * @param {string} api endpoints
 * @param {string} method 'GET', 'POST', ....
 * @param {object} tokens
 */
const apiCall = (api, method, tokens) => {
    return new Promise((resolve, reject) => {
        fetch("https://discord.com/api" + api, {
            method: method,
            headers: {
                Authorization: `${tokens.token_type} ${tokens.access_token}`,
                "Content-Type": "application/x-www/form-urlencoded",
            },
        })
            .then((resp) => {
                return resp.json();
            })
            .then((data) => {
                console.log(`~~~~~~~~ discord api called => ${api}`, data);
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

/**
 * Get params from url string
 * @param {string} url
 */
const getParams = (url) => {
    var params = {};
    var parser = document.createElement("a");
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
};
