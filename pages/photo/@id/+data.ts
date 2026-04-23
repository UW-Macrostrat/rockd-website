import { SETTINGS } from "~/settings";

export async function data(pageContext) {
  const photoID = pageContext.urlPathname
    .split("/")[2]
    .replace(/%40/g, "@")
    .replace(/%2B/g, "+");
  const checkinData = await fetch(
    `${SETTINGS.rockdApiURL}/protected/checkins?photo_id=${photoID}`
  )
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error fetching checkin data:", error);
    });

  return { checkin: checkinData.success.data[0] || null };
}
