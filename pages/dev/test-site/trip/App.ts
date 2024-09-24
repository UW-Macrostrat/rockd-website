import { isDetailPanelRouteInternal } from "#/map/map-interface/app-state";
import h from "@macrostrat/hyper";
import { parse } from "path";
import React, { useEffect, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import { getPageContext } from 'vike/getPageContext'

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
    let trip;



    useEffect(() => {
        trip = 1;

        console.log(`Fetching data for trip ID: ${trip}`);

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
    }, []); // Add trip to dependency array

    if (loading) {
        return h("div", { className: 'loading' }, "Loading...");
    }

    if (error) {
        return h("div", { className: 'error' }, [
            h("h1", "Error"),
            h("p", error)
        ]);
    }

    if (!userData) {
        return h("div", { className: 'error' }, [
            h("h1", `Trip ${trip} not found`),
        ]);
    }

    //

    return h("div", { className: 'trip-info' }, [
        h("h1", `Trip ${trip} found`),
        h("p", `${userData.first_name} ${userData.last_name} took a trip to ${userData.name}`)
    ]);
}
