import h from "@macrostrat/hyper";
import "@macrostrat/ui-components";
import { useEffect, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, Image } from "../index";

function getTrip() {
    const pageContext = usePageContext();
    console.log(pageContext.urlParsed);
    let trip = 'urlParsed' in pageContext && pageContext.urlParsed.search.trip;
    console.log(trip);
    return parseInt(trip);
}

export function App() {
    const pageContext = usePageContext();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkinNum, setCheckin] = useState(null);

    let stop;

    useEffect(() => {
        if (pageContext.urlParsed) {
            stop = parseInt(pageContext.urlParsed.search.checkin);
            setCheckin(stop);
        } else {
            setCheckin(0);
        }
        console.log(`Fetching data for checkin ID: ` + stop);

        // Ensure trip ID is valid
        if (isNaN(stop)) {
            setLoading(false);
            setError('Invalid checkin ID.');
            return;
        }

        fetch("https://rockd.org/api/v2/protected/checkins?checkin_id=" + stop)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched data:', data); // Log fetched data for debugging
                if (data.success && data.success.data.length > 0) {
                    setUserData(data.success.data[0]);
                } else {
                    setUserData(null);
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                setError(error.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []); 

    if (loading) {
        if(checkinNum == null) {
            return h("div", { className: 'loading' }, [
                h("h1", "Loading checkin..."),
            ]);
        } else {
            return h("div", { className: 'loading' }, [
                h("h1", "Loading checkin " + checkinNum + "..."),
            ]);
        }

    }

    if (error) {
        return h("div", { className: 'error' }, [
            h("h1", "Error"),
            h("p", error)
        ]);
    }

    if (!userData) {
        return h("div", { className: 'error' }, [
            h("h1", "Trip " + checkinNum + " not found"),  
        ]);
    }

    let checkin = userData;
    console.log(checkin)

    let profile_pic = h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + checkin.person_id, className: "profile-pic"});
    
    // format rating
    let ratingArr = [];
    for(var i = 0; i < checkin.rating; i++) {
        ratingArr.push(h(Image, {className: "star", src: "blackstar.png"}));
    }

    // get observations
    let observations = [];
    for(var i = 0; i < checkin.observations.length; i++) {
        let observation = checkin.observations[i];

        // no oberservation names
        if(observation.rocks.strat_name == null) {
            observations.push(
                h('div', {className: 'observation'}, [
                    h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + observation.photo}),
                ])
            );
        } else if(observation.photo != null) {
            observations.push(
                h('div', {className: 'observation'}, [
                    h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + observation.photo}),
                    h('h4', {className: 'observation-header'}, observation.rocks.strat_name.strat_name_long),
                ])
            );
        }
    }

    return h('div', { className: 'main'}, [
        h('h1', { className: "checkin-header" }, checkin.description),
        h(BlankImage, { className: "location-img", src: "https://api.mapbox.com/styles/v1/jczaplewski/cje04mr9l3mo82spihpralr4i/static/geojson(%7B%22type%22%3A%22Point%22%2C%22coordinates%22%3A%5B" + checkin.lng + "%2C" + checkin.lat + "%5D%7D)/" + checkin.lng + "," + checkin.lat + ",5,0/1200x400?access_token=" + import.meta.env.VITE_MAPBOX_API_TOKEN }),
        h('div', { className: 'stop-header' }, [
            h('h3', {className: 'profile-pic'}, profile_pic),
            h('div', {className: 'stop-main-info'}, [
                h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
                h('h4', {className: 'edited'}, checkin.created),
                h('p', {className: 'location'}, [
                    h('p', "Near " + checkin.near),
                ]),
                h('h3', {className: 'rating'}, ratingArr),
            ]),
        ]),
        h('div', { className: 'observations' }, observations)
    ]);
}
