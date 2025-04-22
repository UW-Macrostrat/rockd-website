import h from "@macrostrat/hyper";
import { usePageContext } from 'vike-react/usePageContext';
import { Photos } from "../index"; 
import { BlankImage, imageExists, Footer, apiURL, apiURLOld, useRockdAPI } from "../../index";


export function Page() {
    const pageContext = usePageContext();
    const photoID = parseInt(pageContext.urlParsed.pathname.split("/")[2]);
    const checkinData = useRockdAPI("protected/checkins?photo_id=" + photoID);

    if (!checkinData) {
        return h("div", { className: 'loading' }, [
            h("h1", "Loading checkin..."),
        ]);       
    }

    if (checkinData.success.data.length == 0) {
        return h("div", { className: 'error' }, [
            h(BlankImage, {className: "error-img", src: "https://rockd.org/assets/img/404.jpg"}),
            h("h1", "Photo " + photoID + " not found!"),  
        ]); 
    }

    const checkin = checkinData.success.data[0];
    let photoIDArr = [checkin.photo];
    checkin.observations.forEach(e => {
        if(Object.keys(e.rocks).length != 0) {
            photoIDArr.push(e.photo)
        }
    })

    console.log("outside", photoIDArr)

    return h(Photos, { photoID, checkinData });
}