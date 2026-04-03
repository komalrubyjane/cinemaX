import { ReactNode, useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

import { INITIAL_DETAIL_STATE } from "src/constant";
import createSafeContext from "src/lib/createSafeContext";
import { useLazyGetAppendedVideosQuery } from "src/store/slices/discover";
import { MEDIA_TYPE } from "src/types/Common";
import { MovieDetail } from "src/types/Movie";

interface DetailType {
  id?: number;
  mediaType?: MEDIA_TYPE;
}
export interface DetailModalConsumerProps {
  detail: { mediaDetail?: MovieDetail } & DetailType;
  setDetailType: (newDetailType: DetailType) => void;
}

export const [useDetailModal, Provider] =
  createSafeContext<DetailModalConsumerProps>();

export default function DetailModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const location = useLocation();
  const [detail, setDetail] = useState<
    { mediaDetail?: MovieDetail } & DetailType
  >(INITIAL_DETAIL_STATE);

  const [getAppendedVideos] = useLazyGetAppendedVideosQuery();

  const handleChangeDetail = useCallback(
    async (newDetailType: { mediaType?: MEDIA_TYPE; id?: number }) => {
      if (!!newDetailType.id && newDetailType.mediaType) {
        try {
          // First set the modal to open with id and mediaType
          setDetail(newDetailType);
          console.log('DEBUG: Modal opened for ID:', newDetailType.id);
          
          // Then fetch the video data
          console.log('DEBUG: Calling getAppendedVideos...');
          const result = getAppendedVideos({
            mediaType: newDetailType.mediaType,
            id: newDetailType.id as number,
          });
          console.log('DEBUG: Result object from lazy query:', result);
          
          console.log('DEBUG: Calling unwrap...');
          const response = await result.unwrap();
          console.log('DEBUG: Unwrapped successfully! Response:', response);
          
          // Now update with the video data
          console.log('DEBUG: Setting mediaDetail with', response?.title || 'unknown');
          setDetail({ ...newDetailType, mediaDetail: response });
          console.log('DEBUG: State update complete');
        } catch (err: any) {
          console.error("ERROR in handleChangeDetail:", {
            message: err?.message,
            status: err?.status,
            data: err?.data,
            fullError: err
          });
          // Still show the modal, just without videos
          setDetail({ ...newDetailType, mediaDetail: undefined });
        }
      } else {
        setDetail(INITIAL_DETAIL_STATE);
      }
    },
    [getAppendedVideos]
  );

  useEffect(() => {
    setDetail(INITIAL_DETAIL_STATE);
  }, [location.pathname, setDetail]);

  useEffect(() => {
    console.log('DetailModal opened:', detail.id ? `ID ${detail.id}` : 'closed', {
      hasMediaDetail: !!detail.mediaDetail,
      hasVideos: !!detail.mediaDetail?.videos?.results?.length
    });
  }, [detail]);

  return (
    <Provider value={{ detail, setDetailType: handleChangeDetail }}>
      {children}
    </Provider>
  );
}
