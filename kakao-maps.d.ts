export {};

type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

type KakaoMap = {
  setCenter: (p: KakaoLatLng) => void;
  panTo: (p: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  getCenter: () => KakaoLatLng;
  getLevel: () => number;
  relayout: () => void;
};

type KakaoLatLngBounds = {
  contain: (latlng: KakaoLatLng) => boolean;
};

type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void;
  getPosition: () => KakaoLatLng;
};

type KakaoInfoWindow = {
  setContent: (html: string) => void;
  open: (map: KakaoMap, marker: KakaoMarker) => void;
  close: () => void;
};

type KakaoGeocoderAddress = { x: string; y: string };

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (
          container: HTMLElement,
          options: {
            center: KakaoLatLng;
            level: number;
          }
        ) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        LatLngBounds: new (sw: KakaoLatLng, ne: KakaoLatLng) => KakaoLatLngBounds;
        Marker: new (options: {
          position: KakaoLatLng;
          map?: KakaoMap;
          clickable?: boolean;
        }) => KakaoMarker;
        InfoWindow: new (options: { content: string }) => KakaoInfoWindow;
        event: {
          addListener: (
            target: KakaoMap | KakaoMarker,
            type: string,
            handler: () => void
          ) => void;
        };
        services: {
          Status: { OK: string };
          Geocoder: new () => {
            addressSearch: (
              addr: string,
              callback: (
                result: KakaoGeocoderAddress[],
                status: string
              ) => void
            ) => void;
          };
        };
      };
    };
  }
}
