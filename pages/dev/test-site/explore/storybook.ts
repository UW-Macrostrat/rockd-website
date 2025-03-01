import {
    useAPIResult,
  } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";
import { BlankImage, Image } from "../index";

export function getCheckins(lat1, lat2, lng1, lng2) {
  // abitrary bounds around click point
  let minLat = Math.floor(lat1 * 100) / 100;
  let maxLat = Math.floor(lat2 * 100) / 100;
  let minLng = Math.floor(lng1 * 100) / 100;
  let maxLng = Math.floor(lng2 * 100) / 100;

  // change use map coords
  return useAPIResult("https://rockd.org/api/v2/protected/checkins?minlat=" + minLat + 
    "&maxlat=" + maxLat +
    "&minlng=" + minLng +
    "&maxlng=" + maxLng);
}

export function imageExists(image_url){
  var http = new XMLHttpRequest();

  http.open('HEAD', image_url, false);
  http.send();

  return http.status != 404;
}

export function createSelectedCheckins(result) {
  let checkins = [];

  result.forEach((checkin) => {
    // format rating
    let ratingArr = [];
    for(var i = 0; i < checkin.rating; i++) {
        ratingArr.push(h(Image, {className: "star", src: "blackstar.png"}));
    }

    for(var i = 0; i < 5 - checkin.rating; i++) {
      ratingArr.push(h(Image, {className: "star", src: "emptystar.png"}));
    }
    let image;

    if (imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo)) {
      image = h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo});
    } else {
      image = h(Image, { className: 'observation-img', src: "rockd.jpg"});
    }
    

    let temp = h('div', { className: 'checkin' }, [
        h('div', {className: 'checkin-header'}, [
          h('h3', {className: 'profile-pic'}, h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + checkin.person_id, className: "profile-pic"})),
          h('div', {className: 'checkin-info'}, [
              h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
              h('h4', {className: 'edited'}, checkin.created),
              h('p', "Near " + checkin.near),
              h('h3', {className: 'rating'}, ratingArr),
          ]),
        ]),
        h('p', {className: 'description'}, checkin.notes),
        h('a', {className: 'checkin-link', href: "/dev/test-site/checkin?checkin=" + checkin.checkin_id, target: "_blank"}, [
          image,
          h('div', {className: "image-details"}, [
            h('h1', "Details"),
            h(Image, {className: 'details-image', src: "explore/white-arrow.png"})
          ])
        ]),
        h('div', {className: 'checkin-footer'}, [
          h('div', {className: 'likes-container'}, [
            h(Image, {className: 'likes-image', src: "explore/thumbs-up.png"}),
            h('h3', {className: 'likes'}, checkin.likes),
          ]),
          h('div', {className: 'observations-container'}, [
            h(Image, {className: 'observations-image', src: "explore/observations.png"}),
            h('h3', {className: 'comments'}, checkin.observations.length),
          ]),
          h('div', {className: 'comments-container'}, [
            h(Image, {className: 'comments-image', src: "explore/comment.png"}),
            h('h3', {className: 'comments'}, checkin.comments),
          ])
        ]),
      ]);
      
    checkins.push(temp);
  });

  return checkins;
}

export function createFeaturedCheckins(result, mapRef, color) {
  let checkins = [];
  let map = mapRef?.current;
  let stop = 0;

  if(color == "red") {
    color = "red-circle.png";
  } else {
    color = "blue-circle.png";
  }

  result.forEach((checkin) => {
    stop++;
    let pin = h('div', 
      { src: "marker_container.png", 
        className: "marker_container", 
        onClick: () => { 
          map.flyTo({center: [checkin.lng, checkin.lat], zoom: 12});
        } 
      }, [
        h(Image, { src: "explore/" + color, className: "marker" }),
        h('span', { className: "marker-number" }, stop)
      ])


    // format rating
    let ratingArr = [];
    for(var i = 0; i < checkin.rating; i++) {
        ratingArr.push(h(Image, {className: "star", src: "blackstar.png"}));
    }

    for(var i = 0; i < 5 - checkin.rating; i++) {
      ratingArr.push(h(Image, {className: "star", src: "emptystar.png"}));
    }
    let image;

    if (imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo)) {
      image = h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo});
    } else {
      image = h(Image, { className: 'observation-img', src: "rockd.jpg"});
    }
    

    let temp = h('div', { className: 'checkin' }, [
        h('div', {className: 'checkin-header'}, [
          h('h3', {className: 'profile-pic'}, h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + checkin.person_id, className: "profile-pic"})),
          h('div', {className: 'checkin-info'}, [
              h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
              h('h4', {className: 'edited'}, checkin.created),
              h('p', "Near " + checkin.near),
              h('h3', {className: 'rating'}, ratingArr),
          ]),
          pin,
        ]),
        h('p', {className: 'description'}, checkin.notes),
        h('a', {className: 'checkin-link', href: "/dev/test-site/checkin?checkin=" + checkin.checkin_id, target: "_blank"}, [
          image,
          h('div', {className: "image-details"}, [
            h('h1', "Details"),
            h(Image, {className: 'details-image', src: "explore/white-arrow.png"})
          ])
        ]),
        h('div', {className: 'checkin-footer'}, [
          h('div', {className: 'likes-container'}, [
            h(Image, {className: 'likes-image', src: "explore/thumbs-up.png"}),
            h('h3', {className: 'likes'}, checkin.likes),
          ]),
          h('div', {className: 'observations-container'}, [
            h(Image, {className: 'observations-image', src: "explore/observations.png"}),
            h('h3', {className: 'comments'}, checkin.observations.length),
          ]),
          h('div', {className: 'comments-container'}, [
            h(Image, {className: 'comments-image', src: "explore/comment.png"}),
            h('h3', {className: 'comments'}, checkin.comments),
          ])
        ]),
      ]);
      
    checkins.push(temp);
  });

  return checkins;
}