import { Component, ViewChild } from '@angular/core';
import { Tabs } from 'ionic-angular';
import { HomePage } from '../home/home';
import { AboutPage } from '../about/about';
import { ContactPage } from '../contact/contact';

@Component({
  templateUrl: 'tabs.html'
})

export class TabsPage {

  public tab1Root: any;
  public tab2Root: any;
  public tab3Root: any;

  @ViewChild('mainTabs') tabRef: Tabs;

  constructor() {
    // this tells the tabs component which Pages
    // should be each tab's root Page
    this.tab1Root = HomePage;
    this.tab2Root = AboutPage;
    this.tab3Root = ContactPage;
  }

  // ionViewDidLoad() {
  //   console.log('page loaded', this.tabRef)
  //   this.tabRef.select(2);
  // }
}
