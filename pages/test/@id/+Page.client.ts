import h from "@macrostrat/hyper";
import { usePageContext } from 'vike-react/usePageContext';
import { Photos } from "../index"; 


export function Page() {
    const pageContext = usePageContext();
    const photoID = parseInt(pageContext.urlParsed.pathname.split("/")[2]);

    return h(Photos, { photoID });
}