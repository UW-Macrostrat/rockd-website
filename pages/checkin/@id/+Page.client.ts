import h from "@macrostrat/hyper";
import { usePageContext } from 'vike-react/usePageContext';
import { Checkins } from "../index"; 
import { useData } from "vike-react/useData";

export function Page() {
    const { checkin } = useData();
    console.log("Checkin data:", checkin);
    return h(Checkins, { checkin });
}