import h from "@macrostrat/hyper";
import { Trips } from "../index";
import { useData } from "vike-react/useData";

export function Page() {
  const { data, commentsData } = useData();
  return h(Trips, {
    data: data.success.data[0],
    commentsData: commentsData.success.data,
  });
}
