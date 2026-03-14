import h from "@macrostrat/hyper";
import { Checkins } from "../index"; 
import { useData } from "vike-react/useData";

export function Page() {
    const { checkin, comments } = useData();
    return h(Checkins, { checkin, comments });
}