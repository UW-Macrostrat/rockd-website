import h from "@macrostrat/hyper";
import { Checkins } from "../index"; 
import { useData } from "vike-react/useData";

export function Page() {
    const { checkin } = useData();
    console.log("Checkin data:", checkin);
    return h(Checkins, { checkin });
}