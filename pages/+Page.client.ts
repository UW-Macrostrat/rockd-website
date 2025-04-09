import { Image, Footer } from "./index";
import styles from "./main.module.sass";
import "./main-page.sass";
import "@macrostrat/style-system";
import hyper from "@macrostrat/hyper";
import "@macrostrat/style-system";

const h = hyper.styled(styles);


export function Page()  {
    return h("div", { className: "main-page" }, [
        h("div", { className: "new_container field" }, [
            h("div", { className: "mask" }, [
              h(Image, { src: "main-page/field.jpg", className: "start-img back-img", alt: "Field" }),
              h("div", { className: "main-content row row-eq-height" }, [
                h("div", { className: "side" }, [
                  h("div", { className: "center-me" }, [
                    h("div", { className: "center" }, [
                      h(Image, { src: "main-page/rockd_transparent.png", className: "not-huge", alt: "Logo" }),
                      h("p", {}, "Learn, explore, and document your geologic world"),
                      h("div.download-buttons", [
                        h("a", { href: "https://itunes.apple.com/us/app/id1153056624", className: "ios-container" }, [
                          h(Image, { src: "main-page/appstore.png", className: "download-badge ios", alt: "App Store" })
                        ]),
                        h("a", { href: "https://play.google.com/store/apps/details?id=org.macrostrat.rockd", className: "android-container" }, [
                          h(Image, { src: "main-page/google-play-badge.png", className: "download-badge android", alt: "Google Play" })
                        ])
                      ]),
                      h("p", {}, [
                        h("a", { className: "explore-link", href: "/explore" }, "Explore the data")
                      ])
                    ])
                  ]),
                  h(Image, { src: "main-page/main.png", className: "main-img", alt: "Main" })
                ])
              ])
            ])
          ]),
          h("div", { className: "new_container map-container" }, [
              h("div", { className: "map-imgs" }, [
                h(Image, { src: "main-page/grand_canyon.jpg", className: "map-shot grand_canyon" }),
                h(Image, { src: "main-page/new_zealand.jpg", className: "map-shot new_zealand" }),
                h(Image, { src: "main-page/world.jpg", className: "map-shot world" }),
                h(Image, { src: "main-page/appalachia.jpg", className: "map-shot appalachia" })
              ]),
              h("div", { className: "center map-info" }, [
                h("h1", {}, [
                  "Instant access to more than 290 ",
                  h("a", { href: "https://macrostrat.org/map/sources" }, "geologic maps"),
                  " globally"
                ]),
                h("p", {}, [
                  "Includes direct links to ",
                  h("a", { href: "https://macrostrat.org" }, "Macrostrat"),
                  " and ",
                  h("a", { href: "https://xdd.wisc.edu" }, "xDD"),
                  " (where available)"
                ])
              ])
          ]),
          
            h("div", { className: "new_container white-container" }, [
                h("div", { className: "row" }, [
                h("div", { className: "col-sm-6 col-sm-offset-3" }, [
                    h("div", { className: "headline-alligner" }, [
                    h("div", { className: "center curious" }, [
                        h("h1", {}, "Curious what you're standing on?"),
                        h("p", {}, "The Dashboard distills key facts about your location into a single, easy-to-read interface")
                    ])
                    ])
                ]),
                h("div", { className: "col-xs-12 dashboard-img-container" }, [
                    h(Image, { src: "main-page/pilbara-australia.png" }),
                    h(Image, { src: "main-page/huronian-supergroup.png" }),
                    h(Image, { src: "main-page/copper-harbor.png" }),
                    h(Image, { src: "main-page/appalachian-foreland.png" }),
                    h(Image, { src: "main-page/gotthard-pass.png" }),
                    h(Image, { src: "main-page/ozark-plateau.png" }),
                    h(Image, { src: "main-page/eastern-australia.png" })
                ])
                ])
            ]),
            h("div", { className: "new_container red_rock" }, [
                h(Image, { src: "main-page/red_rock.jpg", className: "back-img red-rock-img" }),
            
                h("div", { className: "img-container row row-eq-height" }, [
                  h("div", { className: "col-sm-6 stats-container" }, [
                    h(Image, { src: "main-page/profile.png", className: "profile-img" })
                  ]),
            
                  h("div", { className: "col-sm-6 center-me" }, [
                    h("div", { className: "headline-alligner" }, [
                      h("div", { className: "center" }, [
                        h("h1", {}, '"The best geologist is the one who has seen the most rocks"'),
                        h("p", {}, "Track your progress through the geologic rock record with summary statistics about your checkins")
                      ])
                    ])
                  ])
                ])
              ]),
              h("div", { className: "record-block" }, [
                h("div", { className: "row" }, [
                  h("div", { className: "col-sm-6 col-sm-offset-3" }, [
                    h("div", { className: "headline-alligner" }, [
                      h("div", { className: "center" }, [
                        h("h1", {}, "Record your observations"),
                        h("p", {}, "Rockd allows you to easily record your geological observations, using your location to provide spatially informed suggestions for nearby geologic units, time intervals, and fossils")
                      ])
                    ])
                  ]),
            
                  h("div", { className: "image-grid" }, [
                    h("div", { className: "col-sm-6" }, [
                        h("div", { className: "headline-alligner" }, [
                          h("div", { className: "center left" }, [
                            h(Image, { src: "main-page/checkin.png", className: "record-block-img" }),
                            h("p", { className: "record-img-caption" }, h("span", {}, "Take pictures of and rate features"))
                          ])
                        ])
                      ]),
                
                      h("div", { className: "col-sm-6" }, [
                        h("div", { className: "headline-alligner" }, [
                          h("div", { className: "center right" }, [
                            h(Image, { src: "main-page/strat-names.png", className: "record-block-img" }),
                            h("p", { className: "record-img-caption" }, h("span", {}, "Tag stratigraphic names, even offline"))
                          ])
                        ])
                      ]),
                
                      h("div", { className: "col-sm-6" }, [
                        h("div", { className: "headline-alligner" }, [
                          h("div", { className: "center left" }, [
                            h(Image, { src: "main-page/strike-dip.png", className: "record-block-img" }),
                            h("p", { className: "record-img-caption" }, h("span", {}, "Use your phone's compass to record strike and dip"))
                          ])
                        ])
                      ]),
                
                      h("div", { className: "col-sm-6" }, [
                        h("div", { className: "headline-alligner" }, [
                          h("div", { className: "center right" }, [
                            h(Image, { src: "main-page/taxa.png", className: "record-block-img" }),
                            h("p", { className: "record-img-caption" }, [
                              h("span", {}, "Search for and tag "),
                              h("a", { href: "https://paleobiodb.org" }, "Paleobiology Database"),
                              h("span", {}, " taxa.")
                            ])
                          ])
                        ])
                      ])
                  ]),
                ])
              ]),
            

            h(Footer)
        
    ]);
}