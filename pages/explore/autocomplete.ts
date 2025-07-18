import { useMapRef } from "@macrostrat/mapbox-react";
import { Icon } from "@blueprintjs/core";
import mapboxgl from "mapbox-gl";
import { useEffect, useState, useMemo } from "react";
import h from "./main.module.sass";
import { useRockdAPI } from "~/components/general";
import { deletePins } from "./utils";

export function AutoComplete({setFilteredData, autocompleteOpen, setAutocompleteOpen}) {
  const mapRef = useMapRef();
  const map = mapRef.current;
  const [input, setInput] = useState('');
  const [close, setClose] = useState(false);  
  const [page, setPage] = useState(1);

  // test 
  const [peopleIds, setPeople] = useState([]);
  const [structures, setStructures] = useState([]);
  const [lithologyAttributes, setLithologyAttributes] = useState([]);
  const [stratNameOrphans, setStratNameOrphans] = useState([]);
  const [lithologyIds, setLithologies] = useState([]);
  // const [taxaIds, setTaxa] = useState([]); // fails
  // const [intervalIds, setIntervals] = useState([]); // fails
  // const [stratNameConcepts, setStratNameConcepts] = useState([]); // fails
  // const [minerals, setMinerals] = useState([]); // fails
  // const [lithologyTypes, setLithologyTypes] = useState([]); // doesn't exist
  // const [lithologyClasses, setLithologyClasses] = useState([]); // doesn't exist

  const lithParam = "lith_id=" + lithologyIds.map(item => item.id).join(',');
  const peopleParam = "person_id=" + peopleIds.map(item => item.id).join(',');
  const stratNameOrphanParam = "strat_name_orphan_id=" + stratNameOrphans.map(item => item.id).join(',');
  const lithologyAttributeParam = "lith_att_id=" + lithologyAttributes.map(item => item.id).join(',');
  const structureParam = "structure_id=" + structures.map(item => item.id).join(',');
  // const taxaParam = "taxon_id=" + taxaIds.map(item => item.id).join(','); // fails
  // const intervalParam = "int_id=" + intervalIds.map(item => item.id).join(','); // fails
  // const stratNameConceptParam = "strat_name_concept_id=" + stratNameConcepts.map(item => item.id).join(','); // fails
  // const mineralParam = "mineral_id=" + minerals.map(item => item.id).join(','); // fails
  // const lithologyTypeParam = "=" + lithologyTypes.map(item => item.id).join(','); // doesn't exist
  // const lithologyClassParam = "=" + lithologyClasses.map(item => item.id).join(','); // doesn't exist

  // develop query
  const finalParams = useMemo(() => {
  const params = [
      lithParam,
      peopleParam,
      lithologyAttributeParam,
      stratNameOrphanParam,
      structureParam
    ].filter(param => /\d/.test(param));

    return params.join('&');
  }, [lithologyIds, peopleIds, lithologyAttributes, stratNameOrphans, structures]);

  const queryString = useMemo(() => {
    return finalParams ? `/protected/checkins?${finalParams}` : null;
  }, [finalParams]);


  // get data
  const data = useRockdAPI(queryString + "&page=" + page)?.success.data;
  const nextData = useRockdAPI(queryString + "&page=" + (page + 1))?.success.data;

  // add markers for filtered checkins
  let coordinates = [];
  let lngs = [];
  let lats = [];

  useEffect(() => {
    if(data && data.length > 0 && queryString) {
      setFilteredData({
        current: data,
        next: {
          data: nextData,
          page: page,
          setPage: setPage
        }
      });

      data.forEach((checkin) => {
        coordinates.push([checkin.lng, checkin.lat]);
        lngs.push(checkin.lng);
        lats.push(checkin.lat);
      });

      deletePins('.filtered_pin');

      if (!close) {
        let stop = 0;
        coordinates.forEach((coord) => {
          stop++;
          // marker
          const el = document.createElement('div');
          el.className = 'filtered_pin';
          el.style.backgroundColor = 'green';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid white';
          el.style.width = '15px';
          el.style.height = '15px';

          // Create marker
          new mapboxgl.Marker(el)
            .setLngLat(coord)
            .addTo(map);
        });
      }

      map.fitBounds([
          [ Math.max(...lngs), Math.max(...lats) ],
          [ Math.min(...lngs), Math.min(...lats) ]
      ], {
          maxZoom: 12,
          duration: 0,
          padding: 75
      });
    } else {
      deletePins('.filtered_pin');

      setFilteredData(null);
    }
  }, [data, nextData, queryString]);

  // rest
  const handleInputChange = (event) => {
    setAutocompleteOpen(true);
    setInput(event.target.value); 
    setClose(false);
    setPage(1);
  };

  let result = null;

  try {
    result = useRockdAPI("/autocomplete/" + input);
  } catch (e) {
    return null;
  }

  let searchBar = h('div.search-bar', [
    h('input', { type: "text", placeholder: "Search name", onChange: handleInputChange }),
    h('div.x-icon', [
      h(Icon, { icon: "cross", onClick: () => {
          let input = document.querySelector('input');
          input.value = "";
          setAutocompleteOpen(false);
          setClose(true);
          setFilteredData(null);
          setPage(1);
          deletePins('.filtered_pin');
        } 
      }),
    ]),
  ]);

  const sectionConfigs = [
    { label: 'People', data: peopleIds, setter: setPeople },
    { label: 'Strat Name Orphans', data: stratNameOrphans, setter: setStratNameOrphans },
    { label: 'Structures', data: structures, setter: setStructures },
    { label: 'Lithologies', data: lithologyIds, setter: setLithologies },
    { label: 'Lithology Attributes', data: lithologyAttributes, setter: setLithologyAttributes },
    // { label: 'Taxa', data: taxaIds, setter: setTaxa },
    // { label: 'Intervals', data: intervalIds, setter: setIntervals },
    // { label: 'Lithology Types', data: lithologyTypes, setter: setLithologyTypes },
    // { label: 'Lithology Classes', data: lithologyClasses, setter: setLithologyClasses },
    // { label: 'Strat Name Concepts', data: stratNameConcepts, setter: setStratNameConcepts },
    // { label: 'Minerals', data: minerals, setter: setMinerals },
  ];
  
  const sections = sectionConfigs
    .filter(({ data }) => data.length > 0)
    .map(({ label, data, setter }) =>
      h('div', [
        h('h3', label),
        createFilteredItems(data, setter, setPage)
      ])
    );

  const filterContainer = sections.length != 0 ? h("div.filter-container", [
    h('h2', "Filters"),
    h('ul', [
      sections
    ]),
  ]) : null; 
  
  if(!result || close) return h('div', {className: "autocomplete"}, [
    searchBar
  ]);
  result = result.success.data;

  let results;

  if(autocompleteOpen) {
    const lithologies = renderSection("Lithologies", "lithologies", result?.lithologies, setLithologies, lithologyIds, setAutocompleteOpen);
    const strat_name_orphans = renderSection("Stratigraphic Name Orphans", "strat_name_orphans", result?.strat_name_orphans, setStratNameOrphans, stratNameOrphans, setAutocompleteOpen);
    const structures_items = renderSection("Structures", "structures", result?.structures, setStructures, structures, setAutocompleteOpen);
    const lithology_attributes = renderSection("Lithology Attributes", "lithology_attributes", result?.lithology_attributes, setLithologyAttributes, lithologyAttributes, setAutocompleteOpen);
    const people = renderSection("People", "people", result?.people, setPeople, peopleIds, setAutocompleteOpen);
    // sections commented out that don't work or don't exist
    // const intervals = renderSection("Intervals", "intervals", result?.intervals, setIntervals, intervalIds, setAutocompleteOpen);
    // const lithology_types = renderSection("Lithology Types", "lithology_types", result?.lithology_types, setLithologyTypes, lithologyTypes, setAutocompleteOpen);
    // const lithology_classes = renderSection("Lithology Classes", "lithology_classes", result?.lithology_classes, setLithologyClasses, lithologyClasses, setAutocompleteOpen);
    // const strat_name_concepts = renderSection("Stratigraphic Name Concepts", "strat_name_concepts", result?.strat_name_concepts, setStratNameConcepts, stratNameConcepts, setAutocompleteOpen);
    // const minerals_items = renderSection("Minerals", "minerals", result?.minerals, setMinerals, minerals, setAutocompleteOpen);
    // const taxa = renderSection("Taxa", "taxa", result?.taxa, setTaxa, taxaIds, setAutocompleteOpen);

    // result
    results = h('div.results', [
      people,
      lithologies,
      lithology_attributes,
      strat_name_orphans,
      structures_items,
      // minerals_items,
      // taxa,
      // intervals,
      // strat_name_concepts,
      // lithology_types,
      // lithology_classes,
    ]);
  }

  /*
  useEffect(() => {
    setLithologyData(useRockdAPI("/proctected/checkins?lith_id=" + lithologies.map(item => item.id).join(',') + "&all=100"));
  }, [lithologies]);
  */

  const wrapper = h('div.autocomplete-wrapper', [
    filterContainer,
    results,
  ]);

  return h('div.autocomplete', [
    searchBar,
    wrapper,
  ]);
}

function createFilteredItems(arr, set, setPage) {
  return arr.map((item) => {
    return h("li.filter-item", [ 
      h('div', item.name),
      h(Icon, { className: 'red-cross', icon: "cross", style: {color: "red"}, onClick: () => {
          set(arr.filter((person) => person != item));
          setPage(1);
        } 
      })
    ])
  })
}

function renderSection(label, key, resultList, setFn, existingIds, setAutocompleteOpen) {
  return resultList?.length > 0
    ? h(`div.${key}`, [
        h('h2', label),
        h('ul', createFilteredNames(resultList, setFn, existingIds, setAutocompleteOpen))
      ])
    : null;
}

function createFilteredNames(result, set, existing, setAutocompleteOpen) {
  return result.map((item) =>
    h('li', {
      onClick: () => {
        if (!existing.includes(item)) {
          setAutocompleteOpen(false);
          set(existing.concat([item]));
        }
      }
    }, item.name)
  )
}