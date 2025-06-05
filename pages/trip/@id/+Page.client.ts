import h from "@macrostrat/hyper";
import { Trips } from "../index"; 
import { useData } from "vike-react/useData";

export function Page() {
    const { data } = useData();

    return h(Trips, { data: data.success.data[0]});
}