import { isDetailPanelRouteInternal } from "#/map/map-interface/app-state";
import h from "@macrostrat/hyper";
import React, { useEffect, useState } from 'react';
import { usePageContext } from 'vike-react/usePageContext';

function getTrip() {
    const pageContext = usePageContext();
    const trip = 'urlParsed' in pageContext && pageContext.urlParsed.search.trip;
    return parseInt(trip);
}

export function App() {
    let trip = getTrip();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        trip = 1;

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
    }, [trip]);

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

    return h("div", { className: 'trip-info' }, [
        h("h1", `Trip ${trip} found`),
        h("p", `${userData.first_name} ${userData.last_name} took a trip to ${userData.name}`)
    ]);
}
