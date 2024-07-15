import {supabase} from '#/lib/supabase';
import {logger} from '#/logger';
import {
  Coordinates,
  Coords,
  NearbyStoresServices,
  StoreCategory,
} from '#/types/automate';
import {useQuery} from '@tanstack/react-query';

export const RQKEY = (coord: Coords | null) => ['nearby-store', coord];

export function useGetNearbyStoreQuery(
  coord: Coords | null,
  service_ids: number[],
) {
  return useQuery({
    queryKey: RQKEY(coord),
    queryFn: async () => {
      const {data, error} = await supabase
        .rpc(
          'get_nearby_stores',
          coord
            ? {_lat: coord.lat, _lng: coord.lng, _service_ids: service_ids}
            : {_lat: 0, _lng: 0, _service_ids: service_ids},
        )
        .returns<NearbyStoresServices[]>();

      if (error) {
        logger.error('ServiceError', {error});

        throw error;
      }

      return data;
    },
  });
}

export function useGetStoreOpenDaysQuery({id}: {id: string}) {
  return useQuery({
    queryKey: ['store-availability', id],
    queryFn: async () => {
      const {data, error} = await supabase
        .rpc('get_store_available_slots', {
          storeid: id,
        })
        .not('available_timeslots', 'is', null);

      if (error) {
        logger.error('useGetStoreOpenDaysQuery', {error});
        throw error;
      }
      return data;
    },
    enabled: !!id,
  });
}

export function useStoreQuery(storeId: string) {
  return useQuery({
    queryKey: ['store', {id: storeId}],
    queryFn: async () => {
      const {data, error} = await supabase
        .from('store')
        .select(
          'id, name, address, store_img, banner_img, store_logo, outside_img, business_hours, contact_no, latitude, longitude, categories(id, name)',
        )
        .eq('id', storeId)
        .single();

      if (error) {
        logger.error('useStoreQuery', {error});
        throw error;
      }

      return data;
    },
  });
}

export function useSearchStoresQuery({
  lat,
  lng,
  keyword,
}: {
  keyword: string;
  lng: number | null;
  lat: number | null;
}) {
  return useQuery({
    queryKey: ['store-searches', keyword],
    queryFn: async () => {
      const {data, error} = await supabase.rpc('search_nearby_stores', {
        _lat: lat!,
        _lng: lng!,
        _search: keyword,
      });
      if (error) {
        logger.error('useSearchStoresQuery', {error});
        throw error;
      }
      return data;
    },
  });
}
