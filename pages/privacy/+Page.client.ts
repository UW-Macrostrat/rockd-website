import { Footer } from "~/components/general";
import h from "./main.module.sass";
import "@macrostrat/style-system";

export function Page() {
    return h("div", { className: "main-page" }, [
        h("div", {className: "content"}, [
            h("div", { className: 'header' }, [
                h("h1", "Privacy Policy"),
            ]),
          
            // Scope Section
            h("div", {className: "section"}, [
              h("h3", {className: "header"}, "Scope"),
              h("span", {className: "highlight-answer"}, 
                "Your privacy is important to Rockd and we go to great lengths to protect it. This Privacy Statement applies to the online collection of personal information via websites and mobile applications operated by Rockd, Macrostrat.org, and its partner non-profit academic organizations. This Statement does not apply to information collected in any other way, including offline. " +
                "Our App and website may contain links to sites maintained by others. This Privacy Statement does not reflect the privacy practices of those sites."
              ),
            ]),
          
            // Highlights Section
            h("div", {className: "section"}, [
              h("h3", {className: "header"}, "Highlights"),
          
              h("span", {className: "highlight-question"}, "What personal information is collected and how is that information used?"),
              h("span", {className: "highlight-answer"}, 
                "We collect information about our users in three ways: directly from the user (when registering an account, when submitting a checkin or observation), from our web server logs, and through cookies. " +
                "We use the information primarily to provide you with a personalized Internet or mobile application experience that delivers the information, resources, and services that are most relevant and helpful to you. " +
                "We do not share with others any of the personal contact information or data you provide, unless we say so in this Privacy Statement, or when we believe in good faith that the law requires it."
              ),
          
              h("span", {className: "highlight-question"}, "How is my personal information protected?"),
              h("span", {className: "highlight-answer"}, 
                "We have implemented certain appropriate security measures to help protect your personal information from accidental loss and from unauthorized access, use, or disclosure. " +
                "We store the information about you on a server with restricted access and appropriate monitoring. We use secure https connections when receiving and sending data to your mobile device or web browser. " +
                "We use intrusion detection and virus protection software. Despite these measures, we cannot guarantee that unauthorized persons will always be unable to defeat our security measures."
              ),
          
              h("span", {className: "highlight-question"}, "Who has access to the personal information?"),
              h("span", {className: "highlight-answer"}, 
                "We will not sell, rent, or lease mailing lists or other user data to others, and we will not make your personal information available to any unaffiliated parties, except our approved agents and contractors, or as otherwise described in this Privacy Statement. " +
                "We rely on some of our affiliates for support of the products and services we offer, and we share some of our data and basic functions with Macrostrat.org; all of our affiliates are all required to preserve the confidentiality of any personal information they may access. " +
                "We will not disclose any personal information or information about your usage of our websites or mobile applications to unaffiliated third parties, except as necessary to service the account, to enforce the terms of use, to meet our obligations to content and technology providers, or as required by law."
              ),
          
              h("span", {className: "highlight-question"}, "How may I correct, amend, or delete my personal information, or update my preferences?"),
              h("span", {className: "highlight-answer"}, 
                "You may cancel your registration, update your preferences, and edit and permanently delete any data that you contribute to Rockd at any time. " +
                "We will not contact you to share information about our App or services. If you would like information about our App or data, please feel free to contact us at https://rockd.org."
              ),
            ]),
          
            // Full Privacy Statement Section
            h("div", {className: "section"}, [
              h("h3", {className: "header"}, "Full Privacy Statement"),
          
              h("span", {className: "highlight-question"}, "What personal information does Rockd collect and how do we use it?"),
              h("span", {className: "highlight-answer"}, 
                "We collect information about our users in three ways: directly from the user, from our web server logs, and through cookies. " +
                "We use the information primarily to provide you with a personalized Internet experience that delivers the information, resources, and services that are most relevant and helpful to you. " +
                "We don't share any of the information you provide with others, unless we say so in this Privacy Statement, or when we believe in good faith that the law requires it, or unless you explicitly make your contributed data public."
              ),
          
              h("span", {className: "highlight-question"}, "User-contributed information"),
              h("span", {className: "highlight-answer"}, 
                "When you register for our services, we ask you to provide some personal information, which we use only for the purposes of identifying you when you use our App and contribute data. " +
                "We keep only your name and email address in a database to enable you to login, for future reference, and as needed for you to have a personalized experience. " +
                "If you contact us, we may ask you to provide information about your device or about the issues you are trying to resolve. This information is necessary to help us answer your questions. We may record your requests and our responses for quality control purposes. " +
                "Please remember that any information disclosed by you and identified in the App settings as public will be shared with other users of the App and made available on the rockd.org. " +
                "You should exercise caution when disclosing personal information in these areas. Don't disclose information in data that you explicitly identify as public that might be considered confidential."
              ),
          
              h("span", {className: "highlight-question"}, "Webserver logs"),
              h("span", {className: "highlight-answer"}, 
                "When you visit our website, we may track information about your visit and store that information in web server logs, which are records of the activities on our sites. Our servers automatically capture and save the information electronically. Examples of the information we may collect include: " +
                "Your unique Internet protocol address, The name of your unique Internet service provider, The city, state, and country from which you access our website, The kind of browser or computer you use, The number of links you click within the App and on our site, The date and time of your visit, The web page from which you arrived to our site, The pages you viewed on the App or site, Certain searches/queries that you conducted via our website, The information we collect in web server logs helps us administer the site, analyze its usage, protect the website and its content from inappropriate use, and improve the user's experience."
              ),
          
              h("span", {className: "highlight-question"}, "Cookies"),
              h("span", {className: "highlight-answer"}, 
                "In order to offer and provide a customized and personal service, we may use cookies to store and help track information about you. Cookies are small pieces of data that are sent to your browser from a web server and stored on your computer's hard drive. We use cookies to help remind us who you are and to help you navigate our sites during your visits. Cookies allow us to save passwords and preferences for you so you won't have to reenter them each time you visit. " +
                "The use of cookies is standard practice. Most browsers are initially set up to accept cookies. However, if you prefer, you can set your browser to either notify you when you receive a cookie or to refuse to accept cookies. You should understand that some features of many sites may not function properly if you don't accept cookies."
              ),
          
              h("span", {className: "highlight-question"}, "Third party services"),
              h("span", {className: "highlight-answer"}, 
                "Use of the Rockd App requires authentication using the OAuth authentication system (http://oauth.net). We do not store any of your passwords. " +
                "In order to provide you with a personalized service, we must store data on your device for a fixed period of time (see Cookies above). Storing this information allows Rockd to recognize you when you return to the App on your unlocked mobile device or browser. To remove all data and authentication information, you may delete the Rockd App from your device. From a browser, you may clear your cache and delete the Rockd.org-specific cookie data."
              ),
            ]),
          
            // Protection of Personal Information Section
            h("div", {className: "section"}, [
              h("h3", {className: "header"}, "Protection of personal information"),
              h("span", {className: "highlight-answer"}, 
                "We have implemented certain appropriate security measures to help protect your personal information from accidental loss and from unauthorized access, use, or disclosure. For example, all data received from and transmitted to you from within Rockd or on rockd.org are protected with Transport Layer Security (TLS) technology. " +
                "Also, we store the information about you in a data center with restricted access and appropriate monitoring, and we use a variety of technical security measures to secure your data. However, please note that we cannot guarantee that unauthorized persons will always be unable to defeat our security measures."
              ),
            ]),
          
            // Questions Section
            h("div", {className: "section"}, [
              h("h3", {className: "header"}, "Questions?"),
              h("span", {}, "If you have any additional questions or concerns related to this Statement and/or our practices, please visit us at "),
              h("a", {href: "https://rockd.org"}, "https://rockd.org"),
            ]),
          
            // Privacy Statement Changes Section
            h("div", {className: "section bottoms"}, [
              h("h3", {className: "header"}, "Privacy statement changes"),
              h("p", {}, "If our information practices change in a significant way, we will post the policy changes here and in the Rockd App Privacy information page. This Privacy Statement was last updated on June 15, 2016."),
            ]),
          ]),          
        h(Footer)
    ]);
};

/*
<div class="content">
  <h1 class="title">Rockd Privacy Policy</h1>

  <div class="section">
    <h3 class="header">Scope</h3>
    Your privacy is important to Rockd and we go to great lengths to protect it. This Privacy Statement applies to the online collection of personal information via websites and mobile applications operated by Rockd, Macrostrat.org, and its partner non-profit academic organizations. This Statement does not apply to information collected in any other way, including offline.

    Our App and website may contain links to sites maintained by others. This Privacy Statement does not reflect the privacy practices of those sites.
  </div>

  <div class="section">
    <h3>Highlights</h3>

    <span class="highlight-question">What personal information is collected and how is that information used?</span>

    <span class="highlight-answer">We collect information about our users in three ways: directly from the user (when registering an account, when submitting a checkin or observation), from our web server logs, and through cookies.
    We use the information primarily to provide you with a personalized Internet or mobile application experience that delivers the information, resources, and services that are most relevant and helpful to you.
    We do not share with others any of the personal contact information or data you provide, unless we say so in this Privacy Statement, or when we believe in good faith that the law requires it.</span>

    <span class="highlight-question">How is my personal information protected?</span>

    <span class="highlight-answer">We have implemented certain appropriate security measures to help protect your personal information from accidental loss and from unauthorized access, use, or disclosure.
    We store the information about you on a server with restricted access and appropriate monitoring.
    We use scure https connections when receiving and sending data to your mobile device or web browser.
    We use intrusion detection and virus protection software.
    Despite these measures, we cannot guarantee that unauthorized persons will always be unable to defeat our security measures.</span>

    <span class="highlight-question">Who has access to the personal information?</span>

    <span class="highlight-answer">We will not sell, rent, or lease mailing lists or other user data to others, and we will not make your personal information available to any unaffiliated parties, except our approved agents and contractors, or as otherwise described in this Privacy Statement.
    We rely on some of our affiliates for support of the products and services we offer, and we share some of our data and basic functions with Macrostrat.org; all of our affiliates are all required to preserve the confidentiality of any personal information they may access.
    We will not disclose any personal information or information about your usage of our websites or mobile applications to unaffiliated third parties, except as necessary to service the account, to enforce the terms of use, to meet our obligations to content and technology providers, or as required by law.</span>

    <span class="highlight-question">How may I correct, amend, or delete my personal information, or update my preferences?</span>

    <span class="highlight-answer">You may cancel your registration, update your preferences, and edit and permanently delete any data that you contribute to Rockd at any time.
    We will not contact you to share information about our App or services. If you would like information about our App or data, please feel free to contract us at https://rockd.org.</span>
  </div>

  <div class="section">
    <h3>Full Privacy Statement</h3>

    <span class="highlight-question">What personal information does Rockd collect and how do we use</span>

    <span class="highlight-answer">We collect information about our users in three ways: directly from the user, from our web server logs, and through cookies. We use the information primarily to provide you with a personalized Internet experience that delivers the information, resources, and services that are most relevant and helpful to you. We don't share any of the information you provide with others, unless we say so in this Privacy Statement, or when we believe in good faith that the law requires it, or unless you explicitly make your contributed data public.</span>

    <span class="highlight-question">User-contributed information</span>

    <span class="highlight-answer">When you register for our services, we ask you to provide some personal information, which we use only for the purposes of identifying you when you use our App and contribute data. We keep only your name and email address in a database to enable you to login, for future reference, and as needed for you to have a personalized experience.
    If you contact us, we may ask you to provide information about your device or about the issues you are trying to resolve. This information is necessary to help us answer your questions. We may record your requests and our responses for quality control purposes.
    Please remember that any information disclosed by you and identified in the App settings as public will be shared with other users of the App and made available on the rockd.org. You should exercise caution when disclosing personal information in these areas. Don't disclose information in data that you explicitly identify as public that might be considered confidential.</span>

    <span class="highlight-question">Webserver logs</span>
    <span class="highlight-answer">
        When you visit our website, we may track information about your visit and store that information in web server logs, which are records of the activities on our sites. Our servers automatically capture and save the information electronically. Examples of the information we may collect include:
        <ul>
        <li>Your unique Internet protocol address</li>
        <li>The name of your unique Internet service provider</li>
        <li>The city, state, and country from which you access our website</li>
        <li>The kind of browser or computer you use</li>
        <li>The number of links you click within the App and on our site</li>
        <li>The date and time of your visit</li>
        <li>The web page from which you arrived to our site</li>
        <li>The pages you viewed on the App or site</li>
        <li>Certain searches/queries that you conducted via our website</li>
        <li>The information we collect in web server logs helps us administer the site, analyze its usage, protect the website and its content from inappropriate use, and improve the user's experience.</li>
        </ul>
    </span>

    <span class="highlight-question">
      Cookies
    </span>

    <span class="highlight-answer">
      In order to offer and provide a customized and personal service, we may use cookies to store and help track information about you. Cookies are small pieces of data that are sent to your browser from a web server and stored on your computer's hard drive. We use cookies to help remind us who you are and to help you navigate our sites during your visits. Cookies allow us to save passwords and preferences for you so you won't have to reenter them each time you visit.

      The use of cookies is standard practice. Most browsers are initially set up to accept cookies. However, if you prefer, you can set your browser to either notify you when you receive a cookie or to refuse to accept cookies. You should understand that some features of many sites may not function properly if you don't accept cookies.
    </span>

    <span class="highlight-question">Third party services</span>
    <span class="highlight-answer">Use of the Rockd App requires authentication using the OAuth authentication system (http://oauth.net). We do not store any of your passwords. In order to provide you with a personalized service, we must store data on your device for a fixed period of time (see Cookies above). Storing this information allows Rockd to recognize you when you return to the App on your unlocked mobile device or browser. To remove all data and authentication information, you may delete the Rockd App from your device. From a browser, you may clear your cache and delete the Rockd.org-specific cookie data.</span>

  </div>

  <div class="section">
    <h3>Protection of personal information</h3>

    <span class="highlight-answer">We have implemented certain appropriate security measures to help protect your personal information from accidental loss and from unauthorized access, use, or disclosure. For example, all data received from and transmitted to you from within Rockd or on rockd.org are protected with Transport Layer Security (TLS) technology. Also, we store the information about you in a data center with restricted access and appropriate monitoring, and we use a variety of technical security measures to secure your data. However, please note that we cannot guarantee that unauthorized persons will always be unable to defeat our security measures.</span>

    <span class="highlight-question">Who has access to the personal information?</span>
    <span class="highlight-answer">We will not sell, rent, or load, lease, or distribute in any way mailing lists or any other user data to third parties, and we will not make your personal information available to any unaffiliated parties, except as follows:
    When you voluntarily make any data you contribute to Rockd public, your name and any of those field data will be shared with all other users of Rockd App and the Rockd.org website. This includes the following:
    If you authorize on your device, we will access location data from your mobile device to provide you a customized experience and to allow you to record geolocations on your personal geological observations. This location will be shared with users of Rockd App and rockd.org should you choose to make those data public. You have the ability to permanently edit or delete any and all of these location data at any time.
    If you authorize on your device and choose to submit a picture to Rockd, we will access your mobile photos and/or camera to allow you to upload personal photos of your choosing that will be linked to the personal geological observations of your choosing. Photos will be shared with users of Rockd App and rockd.org only if you choose to make those data public. You have the ability to change and remove any and all of your personally contributed photos at any time.
    If you choose to enter any text-based descriptions or data, we will access this information and link it to the geological observation that you specify. Your text descriptions will be shared with users of Rockd App and rockd.org only if you choose to make those data public. You have the ability to change and remove any and all of your personally contributed photos at any time.
    As required by law, in a matter of public safety or policy, as needed in connection with the transfer of our system (for example, if we partner with another organization or institution), or if we believe in good faith that sharing the data is necessary to protect our rights or property.
    We will not disclose any information about your usage to unaffiliated third parties, except as necessary to service the account, to enforce the terms of use, to meet our obligations to content and technology providers, or as required by law.
    We may also use statistics regarding usage for product development purposes, but we only use those statistics in the aggregate and they don't include any personally identifiable information about individual users.
    We may also use public data that your contribute to Rockd to augment and enhance other public data in Rockd.org and Macrostrat.org that are directly related to your public data by virtue of their location or other content.</span>
    <span class="highlight-question">How can I correct, amend, or delete my personal information?</span>
    <span class="highlight-answer">You may cancel your registration and update your preferences at any time. To permanently delete all of your data and delete your account, you may do so in the personal settings section of the Rockd App or on Rockd.org. Deleting the Rockd App from your device will remove all application-specific data. You may also remove any rockd.org cookies stored on your browser.</span>
  </div>

  <div class="section">
    <h3 class="header">Questions?</h3>
    If you have any additional questions or concerns related to this Statement and/or our practices, please visit us at <a href="https://rockd.org">https://rockd.org</a>
  </div>

  <div class="section bottom">
    <h3>Privacy statement changes</h3>
    <p>If our information practices change in a significant way, we will post the policy changes here and in the Rockd App Privacy information page. This Privacy Statement was last updated on June 15, 2016.</p>
  </div>
</div>

<Footer></Footer>*/