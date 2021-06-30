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

function makeRawGqlPacket(op: string, query: string, variables: any) {
  return {
    operationName: `${op}_Template`,
    query,
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

export async function makeAdRequest({ adId, creativeId, lineItemId, orderId, radToken, rollType, podLength, duration }: AdPod) {
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
      duration,
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

const PLAYBACK_ACCESS_TOKEN_QUERY = `
query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {
  streamPlaybackAccessToken(channelName: $login, params: {
    platform: "web", playerBackend: "mediaplayer", playerType: $playerType
  })
  @include(if: $isLive) { 
     value  
     signature
     __typename  
  } 
  videoPlaybackAccessToken(id: $vodID, params: { platform: "web", playerBackend: "mediaplayer", playerType: $playerType })
   @include(if: $isVod) {
       value
       signature
       __typename  
  }
}
`.replace(/[\n\r]/g, '');

export async function getPlayerAccessTokenRequest(login: string, playerType = PlayerType.Site): Promise<{value: string, signature: string}> {
  const res = await gqlRequest(makeRawGqlPacket('PlaybackAccessToken', PLAYBACK_ACCESS_TOKEN_QUERY, {
    isLive: true,
    isVod: false,
    login,
    playerType,
    vodID: ''
  })).then(x => x.json());
  const accessToken = res?.data?.streamPlaybackAccessToken;
  if(!accessToken) throw new Error('No access token');

  delete accessToken.__typename;
  return accessToken;
}

export enum PlayerType {
  AmazonLive = 'amazon_live',
  AmazonProductPage = 'amazon_product_page',
  AmazonVse = 'amazon_vse_test',
  AnimatedThumbnails = 'animated_thumbnails',
  ChannelTrailer = 'channel_trailer',
  ClipsEditing = 'clips-editing',
  ClipsEmbed = 'clips-embed',
  ClipsViewing = 'clips-viewing',
  ClipsWatchPage = 'clips-watch',
  Creative = 'creative',
  Curse = 'curse',
  Dashboard = 'dashboard',
  VideoProducerModal = 'video_producer_modal',
  Embed = 'embed',
  Facebook = 'facebook',
  Feed = 'feed',
  Frontpage = 'frontpage',
  Highlighter = 'highlighter',
  Imdb = 'imdb',
  MultiviewPrimary = 'multiview-primary',
  MultiviewSecondary = 'multiview-secondary',
  Onboarding = 'onboarding',
  PictureByPicture = 'picture-by-picture',
  Popout = 'popout',
  Pulse = 'pulse',
  Site = 'site',
  Thunderdome = 'thunderdome',
  ChannelHomeCarousel = 'channel_home_carousel',
  ChannelHomeLive = 'channel_home_live',
  SiteMini = 'site_mini',
  SquadPrimary = 'squad_primary',
  SquadSecondary = 'squad_secondary',
  TwitchEverywhere = 'twitch_everywhere',
  WatchPartyHost = 'watch_party_host',
  PopTart = 'pop_tart'
}
