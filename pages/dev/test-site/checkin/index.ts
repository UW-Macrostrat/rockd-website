import { isDetailPanelRouteInternal } from "#/map/map-interface/app-state";
import h from "@macrostrat/hyper";
import { parse } from "path";
import React, { useEffect, useState, useRef } from 'react';
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
    const [tripNum, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkinNum, setCheckin] = useState(null);

    let trip;
    let stop;

    useEffect(() => {
        if (pageContext.urlParsed) {
            trip = parseInt(pageContext.urlParsed.search.trip);
            stop = parseInt(pageContext.urlParsed.search.checkin);
            setTrip(trip);
            setCheckin(stop);
        } else {
            setTrip(0);
        }
        console.log(`Fetching data for trip ID: ` + trip);

        // Ensure trip ID is valid
        if (isNaN(trip)) {
            setLoading(false);
            setError('Invalid trip ID.');
            return;
        }

        fetch(`https://rockd.org/api/v2/trips/${trip}`)
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
        if(tripNum == null) {
            return h("div", { className: 'loading' }, [
                h("h1", "Loading trip..."),
            ]);
        } else {
            return h("div", { className: 'loading' }, [
                h("h1", "Loading trip " + tripNum + "..."),
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
            h("h1", "Trip " + tripNum + " not found"),  
        ]);
    }

    let checkin = userData.stops[checkinNum];
    console.log(checkin)

    let data = userData;
    let profile_pic = h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + data.person_id, className: "profile-pic"});

    // format date
    let date = new Date(data.updated);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    data.updated = date.toLocaleDateString('en-US', options);

    // format rating
    let ratingArr = [];
    for(var i = 0; i < checkin.checkin.rating; i++) {
        ratingArr.push(h(Image, {className: "star", src: "blackstar.png"}));
    }

    return h('div', { className: 'main'}, [
        h('h1', { className: "checkin-header" }, checkin.description),
        h(BlankImage, { className: "location-img", src: "https://api.mapbox.com/styles/v1/jczaplewski/cje04mr9l3mo82spihpralr4i/static/" + checkin.checkin.lng + "," + checkin.checkin.lat + ",5,0/1200x300?access_token=" + import.meta.env.VITE_MAPBOX_API_TOKEN }),
        h('div', { className: 'stop-header' }, [
            h('h3', {className: 'profile-pic'}, profile_pic),
            h('div', {className: 'stop-main-info'}, [
                h('h3', {className: 'name'}, data.first_name + " " + data.last_name),
                h('h4', {className: 'edited'}, data.updated),
                h('p', {className: 'location'}, [
                    h('p', "Near " + checkin.checkin.near),
                ]),
                h('h3', {className: 'rating'}, ratingArr),
            ]),
        ]),
    ]);
}
