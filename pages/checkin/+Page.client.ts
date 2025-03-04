import h from "@macrostrat/hyper";
import { LngLatCoords } from "@macrostrat/map-interface";
import { useEffect, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, Image, Footer } from "../index";
import "../main.styl";
import { SETTINGS } from "@macrostrat-web/settings";
import { DarkModeButton } from "@macrostrat/ui-components";
import "./main.sass";
import "@macrostrat/style-system";

function imageExists(image_url){
    var http = new XMLHttpRequest();
  
    http.open('HEAD', image_url, false);
    http.send();
  
    return http.status != 404;
}

export function Page() {
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

    // add checkin photo and notes
    console.log("Checkin photo: ", checkin.photo != null);
    let headerImg;
    if(imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo) && checkin.photo != null) {
        headerImg = h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo})
    } else {
        headerImg = h(BlankImage, { className: 'observation-img', src: "https://storage.macrostrat.org/assets/rockd/rockd.jpg"})
    }

    observations.push(
        h('div', {className: 'observation'}, [
            headerImg,
            h('h4', {className: 'observation-header'}, checkin.notes),
        ])
    );

    // add observations
    for(var i = 0; i < checkin.observations.length; i++) {
        let observation = checkin.observations[i];
        console.log("Observation " + i);
        console.log(observation);

        if(Object.keys(observation.rocks).length != 0) {
            // get liths
            let liths = [];
            for(var j = 0; j < observation.rocks.liths.length; j++) {                
                liths.push(h('p', observation.rocks.liths[j].name));
            }
            

            let LngLatProps = {
                position: {
                    lat: observation.lat,
                    lng: observation.lng
                },
                precision: 3,
                zoom: 10
            };

            // LngLatCoords(LngLatProps);


            // if photo exists
            if (imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + observation.photo)) {
                observations.push(
                    h('div', {className: 'observation'}, [
                        h(BlankImage, { className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + observation.photo}),
                        h('h4', {className: 'observation-header'}, observation.rocks.strat_name?.strat_name_long),
                        h('div', {className: 'observation-details'}, [
                            h('p', {className: 'observation-detail'}, observation.rocks.strat_name?.strat_name_long),
                            h('p', {className: 'observation-detail'}, observation.rocks.map_unit?.unit_name),
                            h('p', {className: 'observation-detail'}, observation.age_est.name + " (" + observation.age_est.b_age + " - " + observation.age_est.t_age + ")"),
                            h('p', {className: 'observation-detail'}, liths),
                            h('p', {className: 'observation-detail'}, observation.orientation.feature?.name),
                            h('p', {className: 'observation-detail'}, "Coords: " + observation.lat + ", " + observation.lng),
                        ]),
                    ])
                );
            } else {
                observations.push(
                    h('div', {className: 'observation'}, [
                        h(BlankImage, { className: 'observation-img', src: "https://storage.macrostrat.org/assets/rockd/rockd.jpg"}),
                        h('h4', {className: 'observation-header'}, observation.rocks.strat_name?.strat_name_long),
                        h('div', {className: 'observation-details'}, [
                            h('p', {className: 'observation-detail'}, observation.rocks.strat_name?.strat_name_long),
                            h('p', {className: 'observation-detail'}, observation.rocks.map_unit?.unit_name),
                            h('p', {className: 'observation-detail'}, observation.age_est.name + " (" + observation.age_est.b_age + " - " + observation.age_est.t_age + ")"),
                            h('p', {className: 'observation-detail'}, liths),
                            h('p', {className: 'observation-detail'}, observation.orientation.feature?.name),
                        ]),
                    ])
                );
            }
        }        
    }

    return h('div', [
        h('div', { className: 'main'}, [
            h('h1', { className: "checkin-header" }, checkin.description),
            h(BlankImage, { className: "location-img", src: "https://api.mapbox.com/styles/v1/jczaplewski/cje04mr9l3mo82spihpralr4i/static/geojson(%7B%22type%22%3A%22Point%22%2C%22coordinates%22%3A%5B" + checkin.lng + "%2C" + checkin.lat + "%5D%7D)/" + checkin.lng + "," + checkin.lat + ",5,0/1200x400?access_token=" + SETTINGS.mapboxAccessToken }),
            h('div', { className: 'stop-header' }, [
                profile_pic,
                h('div', {className: 'stop-main-info'}, [
                    h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
                    h('h4', {className: 'edited'}, checkin.created),
                    h('p', {className: 'location'}, [
                        h('p', "Near " + checkin.near),
                    ]),
                    h('h3', {className: 'rating'}, ratingArr),
                ]),
            ]),
            h('div', { className: 'observations' }, observations),
        ]),
        h(Footer),
        h(DarkModeButton, { className: 'dark-mode-button', showText: true }),
    ])
}
