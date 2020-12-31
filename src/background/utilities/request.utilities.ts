export async function makeGqlHeaders() {
  return {
    'Client-Id': await getClientId(),
    Authorization: `OAuth ${await getCookie('auth-token')}`,
    'X-Device-Id': await getCookie('unique_id') ?? 'PogO',
  }
}

async function getClientId() {
  return (await browser.storage.local.get('clientId')).clientId ?? 'kimne78kx3ncx6brgo4mv6wki5h1ko';
}

async function getCookie(name: string) {
    const cookie = await browser.cookies.get({name, url: 'https://twitch.tv'});
    return cookie?.value;
}

export const TWITCH_USER_PAGE = /^https:\/\/www.twitch.tv\/([^?\/#]+)/;
