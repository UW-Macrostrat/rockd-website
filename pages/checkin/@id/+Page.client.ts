import h from "@macrostrat/hyper";
import { usePageContext } from 'vike-react/usePageContext';
import { Checkins } from "../index"; 

export function Page() {
    const pageContext = usePageContext();
    const checkinID = parseInt(pageContext.urlParsed.pathname.split("/")[2]);
    return h(Checkins, { checkinID });
}