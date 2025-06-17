export async function data(pageContext) {
    const photoID = pageContext.urlPathname.split('/')[2].replace(/%40/g, '@').replace(/%2B/g, '+');
    const checkinData = await fetch(`https://dev.rockd.org/api/protected/checkins?photo_id=${photoID}`)
        .then(response => response.json())
        .catch(error => {
            console.error("Error fetching checkin data:", error);
        });

    return { checkinData };
}