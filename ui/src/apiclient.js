// @flow
// fetch does not send the X-Requested-With header (https://github.com/github/fetch/issues/17),
// but we need the header to detect ajax request (AjaxAwareAuthenticationRedirectStrategy).
const fetchOptions = {
    credentials: 'same-origin',
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    }
};

// TODO handle session timeout and cas redirect

function isAuthenticationRedirect(response) {
    if (response.status === 401) {
        const redirectTarget = response.headers.get('location');
        console.log(redirectTarget);
        if (redirectTarget) {
            return true;
        }
    }
    return false;
}

function createRedirectUrl() {
    return '/smeagol/api/v1/authc?location=' + encodeURIComponent(window.location);
}

function redirect(redirectUrl: string) {
    window.location.href = redirectUrl;
}

function callApi(url) {
    return fetch(url, fetchOptions)
        .then(response => {
            if (isAuthenticationRedirect(response)){
                const redirectUrl = createRedirectUrl();
                console.log(redirectUrl);
                redirect(redirectUrl);
            }
            return response;
        });
}

export default callApi;