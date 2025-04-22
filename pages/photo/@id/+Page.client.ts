import h from "@macrostrat/hyper";
import { usePageContext } from 'vike-react/usePageContext';
import { Photos } from "../index"; 
import { BlankImage, imageExists, Footer, apiURL, apiURLOld, useRockdAPI } from "../../index";


export function Page() {
    const pageContext = usePageContext();
    const photoID = parseInt(pageContext.urlParsed.pathname.split("/")[2]);
    const checkinData = useRockdAPI("protected/checkins?photo_id=" + photoID);

    return h(Photos, { photoID, checkinData });
}