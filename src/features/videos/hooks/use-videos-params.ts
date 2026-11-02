import { useQueryStates } from "nuqs";
import { videosParams } from "../params";

export const useVideosParams = () => {
  return useQueryStates(videosParams);
};
