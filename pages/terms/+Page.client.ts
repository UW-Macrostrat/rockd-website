import { Footer } from "~/components/general";
import h from "./main.module.sass";
import "@macrostrat/style-system";

export function Page() { 
    return h("div", { className: "main-page" }, [
        h("div", { className: "content" }, [
            h("div", { className: 'header' }, [
                h("h1", "Rockd Terms and Conditions"),
            ]),        
            h("div", { className: "section" }, [
              h("h3", { className: "header" }, "Overview"),
              "Rockd is designed to facilitate the collection and use of field-based geological observations of all types. The Rockd Application (Application) and the data it contains are provided freely and on an as-is basis to users. All Users are expected to follow these terms of use outlined in this Terms of Use document."
            ]),
        
            h("div", { className: "section" }, [
              h("h3", {}, "Use of Application and Data Services"),
              h("span", { className: "highlight-answer" }, [
                "Don’t misuse our application or data services. For example, Rockd allows users to post text and image content to our databases that are linked to locations and geological entities. All text and images you post must be pertinent to the geological data and observations supplied to the user through the Application. Do not post obscene, offensive, illegal, content or images or content for which you do not own the copyright. Do not post images portraying dangerous or illegal activity, for example images depicting the defacing of outcrops or collecting of specimens or samples from lands for which government regulations prohibit or regulate such activity. ",
                h("b", {}, "We reserve the right to remove any content that violates these terms of service")
              ])
            ]),
        
            h("div", { className: "section" }, [
              h("h3", {}, "External Content"),
              h("span", { className: "highlight-answer" }, [
                "Our Services and Application display some content that is not created by us. This content is the sole responsibility of the entity that makes it available. We may review content to determine whether it is illegal or violates our policies, and we may remove or refuse to display content that we reasonably believe violates our policies or the law. But that does not necessarily mean that we review content or agree with content, so please don’t assume that we do."
              ])
            ]),
        
            h("div", { className: "section" }, [
              h("h3", {}, "Your Rockd Account"),
              h("span", { className: "highlight-answer" }, [
                "You need a Rockd Account in order to use some of our Services. You may create your own Account. To protect your Account, keep your password confidential. You are responsible for the activity that happens on or through your Account. Try not to reuse your Account password on third-party applications."
              ])
            ]),
        
            h("div", { className: "section" }, [
              h("h3", {}, "Your Content"),
              h("span", { className: "highlight-answer" }, [
                "Some of our Services allow you to upload, submit, store, send or receive content. You retain ownership of any intellectual property rights that you hold in that content. In short, what belongs to you stays yours.",
                "When you upload, submit, store, send or receive content to or through our Services that you identify as public, you give Rockd (and those we work with) a worldwide license to use, host, store, reproduce, modify, create derivative works (such as those resulting from translations, adaptations or other changes we make so that your content works better with our Services), communicate, publish, publicly perform, publicly display and distribute such content.",
                "The rights you grant in this license are for the limited purpose of operating, promoting, and improving our Services, and to develop new ones. This license continues even if you stop using our Services. We offer you ways to access and remove content that you have provided to our Services. Also, in some of our Services, there are terms or settings that narrow the scope of our use of the content submitted in those Services. Make sure you have the necessary rights to grant us this license for any content that you submit to our Services.",
                "Our automated systems analyze your content to provide you personally relevant product features, such as customized search results. This analysis occurs as the content is sent, received, and when it is stored.",
                "If you have a Rockd Account, we may display your name, Profile photo, and actions you take on Rockd. We will respect the choices you make to limit sharing or visibility settings in your Rockd Account. For example, you can choose your settings so your checkins are not Publicly displayed."
              ])
            ]),
        
            h("div", { className: "section" }, [
              h("h3", {}, "Privacy and Copyright Protection"),
              h("span", { className: "highlight-answer" }, [
                "Rockd's privacy policies explain how we treat your personal data and protect your privacy when you use our Services. By using our Services, you agree that Rockd and our partners and collaborators can use such data in accordance with our privacy policies."
              ]),
              h("span", { className: "highlight-answer" }, [
                "We respond to notices of alleged copyright infringement and terminate accounts of repeat infringers according to the process set out in the U.S. Digital Millennium Copyright Act."
              ])
            ]),
        
            h("div", { className: "section bottoms" }, [
              h("h3", {}, "Warranties and Disclaimers"),
              h("span", { className: "highlight-answer" }, [
                "We provide our Application and Data using a reasonable level of skill and care and we hope that you will enjoy using them. But there are certain things that we don’t promise about our Services, for example, that services will exist ad infinitum and will have 100% uptime. Service disruptions can and do occur, both as a result of our mistakes and acts far beyond our control."
              ]),
              h("span", { className: "highlight-answer" }, [
                "Other than as expressly set out in these terms or additional terms, neither Rockd nor partners and collaborators make any specific promises about the services. For example, we don't make any commitments about the content with the services, the specific functions of the services, or their reliability, availability, or ability to meet your needs. ",
                h("b", {}, "We provide the services 'as is'.")
              ]),
              h("span", { className: "highlight-answer bottoms" }, [
                "Some jurisdictions provide for certain warranties, like the implied warranty of merchantability, fitness for a particular purpose and non-infringement. To the extent permitted by law, we exclude all warranties."
              ])
            ])
          ]),
          h(Footer)
    ]);
}
