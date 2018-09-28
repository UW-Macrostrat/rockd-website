module.exports = `SELECT
  trips.trip_id,
  trips.person_id,
  people.first_name,
  people.last_name,
  trips.name,
  trips.description,
  trips.created AS created,
  trips.updated AS updated,
  trips.status,
  COALESCE(trip_likes.likes, 0)::integer AS likes,
  COALESCE(trip_likes.liked, FALSE) AS liked,
  COALESCE(trip_comments.comments, 0)::integer AS comments,
  json_agg(row_to_json((SELECT x FROM (SELECT stops.stop_id, stops.name, stops.description, stops.trip_order, checkins.checkin_id, COALESCE(checkins.checkin, '{}') AS checkin) x))) AS stops
FROM trips
LEFT JOIN stops ON stops.trip_id = trips.trip_id
JOIN people ON trips.person_id = people.person_id
LEFT JOIN LATERAL (
  SELECT
    checkins.checkin_id,
    checkins.notes,
    checkins.near,
    ST_X(checkins.geom) AS lng,
    ST_Y(checkins.geom) AS lat,
    row_to_json((SELECT x FROM (
      SELECT
      checkins.checkin_id,
      checkins.person_id,
      people.first_name,
      people.last_name,
      checkins.notes,
      checkins.rating,
      ST_X(checkins.geom) AS lng,
      ST_Y(checkins.geom) AS lat,
      checkins.near,
      to_char(checkins.created, 'fmMonth DD, YYYY') AS created,
      to_char(checkins.inserted_on, 'fmMonth DD, YYYY') AS added,
      checkins.photo photo,
      COALESCE(checkin_likes.likes, 0) likes,
      COALESCE(checkin_comments.comments, 0) AS comments,
      CASE WHEN
          checkins.checkin_id = (SELECT min(checkin_id) FROM checkins a WHERE a.person_id = checkins.person_id)
          THEN
            True
           ELSE
            FALSE
      END as is_first,
       checkins.status,
      json_agg(observations.observations) AS observations
    ) x)) AS checkin
  FROM checkins
  JOIN people ON checkins.person_id = people.person_id
  LEFT JOIN LATERAL (
    SELECT
        checkin_id,
        count(DISTINCT checkin_likes.person_id) likes,
        CASE WHEN
          $1 = ANY(array_agg(checkin_likes.person_id))
          THEN
            True
           ELSE
            FALSE
         END AS liked
    FROM checkin_likes
    GROUP BY checkin_id
  ) checkin_likes ON checkins.checkin_id = checkin_likes.checkin_id
  LEFT JOIN LATERAL (
    SELECT checkin_id, COALESCE(count(DISTINCT comment_id), 0)::int AS comments
    FROM checkin_comments
    GROUP BY checkin_id
  ) checkin_comments ON checkin_comments.checkin_id = checkins.checkin_id
  LEFT JOIN checkin_observations ON checkin_observations.checkin_id = checkins.checkin_id
  LEFT JOIN  (
    SELECT
      observations.obs_id,
      (
        SELECT row_to_json(
            (SELECT x FROM (
                SELECT
                observations.obs_id,
                observations.photo,
                ST_X(observations.geom) AS lng,
                ST_Y(observations.geom) AS lat,
                  COALESCE(rocks.data, '{}') AS rocks,
                  COALESCE(orientation.data, '{}') AS orientation,
                  COALESCE(fossils.data, '{}') AS fossils,
                  COALESCE(minerals.data, '{}') AS minerals,
                  COALESCE(comments.n_comments, 0)::int AS comments
            ) x)
        )
      ) AS observations
    FROM observations
    LEFT JOIN LATERAL (
      SELECT obs_id, CASE WHEN strat_name::text <> '{}'::text AND map_unit::text <> '{}' AND liths::text <> '{}'::text AND interval::text <> '{}'::text AND notes IS NULL
        THEN '{}'
      ELSE
        COALESCE(row_to_json(
          (SELECT x FROM (SELECT COALESCE(strat_name, '{}') AS strat_name, COALESCE(map_unit, '{}') AS map_unit, COALESCE(liths, '[]') AS liths, COALESCE(interval, '{}') AS interval, COALESCE(notes, '') AS notes) x)
        ), '[]')
      END AS data
      FROM modules.rocks
      WHERE rocks.obs_id = observations.obs_id
    ) rocks ON rocks.obs_id = observations.obs_id
    LEFT JOIN LATERAL (
      SELECT obs_id, CASE WHEN strike is NULL AND dip IS NULL AND dip_dir IS NULL AND (feature->>'structure_id') IS NULL AND notes IS NULL AND trend IS NULL AND plunge IS NULL
          THEN '{}'
        ELSE
          COALESCE(row_to_json(
            (SELECT x FROM (SELECT strike, strikestd, dip, dipstd, dip_dir, trend, trendstd, plunge, plungestd, feature, COALESCE(notes, '') AS notes) x)
          ), '[]')
        END AS data
      FROM modules.orientation
      WHERE orientation.obs_id = observations.obs_id
    ) orientation ON orientation.obs_id = observations.obs_id
    LEFT JOIN LATERAL (
      SELECT obs_id,
        CASE WHEN
          notes IS NULL
          AND json_array_length(taxon) < 1
            THEN '{}'
        ELSE
        COALESCE(row_to_json(
          (SELECT x FROM (SELECT taxon AS taxa, COALESCE(notes, '') AS notes) x)
        ), '[]')
        END AS data
      FROM modules.fossils
      WHERE fossils.obs_id = observations.obs_id
    ) fossils ON fossils.obs_id = observations.obs_id
    LEFT JOIN LATERAL (
      SELECT obs_id,
      CASE WHEN
        notes IS NULL
        AND json_array_length(minerals) < 1
          THEN '{}'
      ELSE
      COALESCE(row_to_json(
        (SELECT x FROM (SELECT minerals, COALESCE(notes, '') notes) x)
      ), '[]')
      END AS data
      FROM modules.minerals
      WHERE minerals.obs_id = observations.obs_id
    ) minerals ON minerals.obs_id = observations.obs_id
    LEFT JOIN LATERAL (
      SELECT obs_id, count(distinct comment_id) AS n_comments
      FROM observation_comments
      WHERE obs_id = observations.obs_id
      GROUP BY obs_id
    ) comments ON comments.obs_id = observations.obs_id
  ) observations ON checkin_observations.obs_id = observations.obs_id
  GROUP BY checkins.checkin_id, checkins.person_id, people.first_name, people.last_name, checkins.notes, checkin_likes.likes, checkin_likes.liked, checkin_comments.comments
) checkins ON checkins.checkin_id = stops.checkin_id
LEFT JOIN LATERAL (
  SELECT
      trip_id,
      COALESCE(count(DISTINCT trip_likes.person_id), 0) likes,
      CASE WHEN
        $1 = ANY(array_agg(trip_likes.person_id))
        THEN
          True
         ELSE
          FALSE
       END AS liked
  FROM trip_likes
  GROUP BY trip_id
) trip_likes ON trips.trip_id = trip_likes.trip_id
LEFT JOIN LATERAL (
  SELECT trip_id, COALESCE(count(DISTINCT comment_id), 0)::int AS comments
  FROM trip_comments
  GROUP BY trip_id
) trip_comments ON trip_comments.trip_id = trips.trip_id
WHERE trips.trip_id = $2
GROUP BY trips.trip_id,
  trips.person_id,
  trips.name,
  trips.description,
  trips.created,
  trips.updated,
  people.first_name,
  people.last_name,
  trips.status,
  trip_likes.likes,
  trip_likes.liked,
  trip_comments.comments
  ORDER BY trips.created DESC
  LIMIT 10
`
