import { makeGqlHeaders } from './utilities/request.utilities';
import { AdPod } from '../types';

export async function gqlRequest(body: any) {
  return fetch('https://gql.twitch.tv/gql', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: await makeGqlHeaders()
  });
}

function makeGqlPacket(op: string, queryHash: string, variables: any) {
  return {
    operationName: op,
    extensions: {
      persistedQuery: {
        sha256Hash: queryHash,
        version: 1
      }
    },
    variables
  };
}

function makeGraphQlAdPacket(event: string, radToken: string, payload: any) {
  return [
    makeGqlPacket(
      'ClientSideAdEventHandling_RecordAdEvent',
      '7e6c69e6eb59f8ccb97ab73686f3d8b7d85a72a0298745ccd8bfc68e4054ca5b', {
        input: {
          eventName: event,
          eventPayload: JSON.stringify(payload),
          radToken
        }
      })
  ];
}

export async function makeAdRequest({ adId, creativeId, lineItemId, orderId, radToken, rollType, podLength }: AdPod) {
  const baseData = {
    stitched: true,
    roll_type: rollType,
    player_mute: false,
    player_volume: 0.8001870069,
    visible: true
  };

  for (let podPosition = 0; podPosition < podLength; podPosition++) {
    const extendedData = {
      ...baseData,
      ad_id: adId,
      ad_position: podPosition,
      duration: 30,
      creative_id: creativeId,
      total_ads: podLength,
      order_id: orderId,
      line_item_id: lineItemId
    };

    await gqlRequest(makeGraphQlAdPacket('video_ad_impression', radToken, extendedData));
    for (let quartile = 0; quartile < 4; quartile++) {
      await gqlRequest(
        makeGraphQlAdPacket('video_ad_quartile_complete', radToken, {
          ...extendedData,
          quartile: quartile + 1
        })
      );
    }

    await gqlRequest(makeGraphQlAdPacket('video_ad_pod_complete', radToken, baseData));
  }
}

export async function getPlayerAccessTokenRequest(login: string): Promise<{value: string, signature: string}> {
  const res = await gqlRequest(makeGqlPacket('PlaybackAccessToken', '0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712', {
    isLive: true,
    isVod: false,
    login: login,
    playerType: 'site',
    vodID: ''
  })).then(x => x.json());
  const accessToken = res?.data?.streamPlaybackAccessToken;
  if(!accessToken) throw new Error('No access token');

  delete accessToken.__typename;
  return accessToken;
}
