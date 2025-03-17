import h from "@macrostrat/hyper";
import { usePageContext } from 'vike-react/usePageContext';
import { Trips } from "../index"; 

export function Page() {
    const pageContext = usePageContext();
    const trip = parseInt(pageContext.urlParsed.pathname.split("/")[2]);
    return h(Trips, { trip});
}