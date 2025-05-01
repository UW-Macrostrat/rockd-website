import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { useRockdAPI, BlankImage } from "../index";
import styles from "../main.module.sass";

const h = hyper.styled(styles);

export function Photos({ photoID }) {
  const [photoIDArr, setPhotoIDArr] = useState([]);
  const [cachedCheckin, setCachedCheckin] = useState(null);

  const photoSeen = photoIDArr.includes(photoID);

  if (photoSeen && cachedCheckin != null) {
    return PhotoViewer({ photoID, photoIDArr });
  }

  return PhotoFetcher({ photoID, setPhotoIDArr, setCachedCheckin });
}

function PhotoFetcher({ photoID, setPhotoIDArr, setCachedCheckin }) {
  const checkinData = useRockdAPI("/protected/checkins?photo_id=" + photoID);

  if (!checkinData) {
    return h("div.loading", [h("h1", "Loading photo " + photoID + "...")]);
  }

  if (!checkinData.success || checkinData.success.data.length === 0) {
    return h("div.error", [
      h(BlankImage, {
        className: "error-img",
        src: "https://rockd.org/assets/img/404.jpg"
      }),
      h("h1", "Photo " + photoID + " not found!")
    ]);
  }

  const checkin = checkinData.success.data[0];
  let newIDs = [checkin.photo];

  checkin.observations?.forEach(obs => {
    if (Object.keys(obs.rocks || {}).length > 0) {
      newIDs.push(obs.photo);
    }
  });

  setPhotoIDArr(prev => Array.from(new Set([...prev, ...newIDs])));
  setCachedCheckin(checkin);

  return PhotoViewer({ photoID, photoIDArr: newIDs });
}

function PhotoViewer({ photoID, photoIDArr }) {
  const currentIdx = photoIDArr.indexOf(photoID);
  const nextPhotoID = photoIDArr[currentIdx + 1];

  return h("div.photos", [
    h("h1", `Photo id: ${photoID}, index: ${currentIdx}`),
    nextPhotoID && h("a", { href: "/test/" + nextPhotoID }, "Next Photo")
  ]);
}
